import { Decoder, Encoder, PacketType, type Packet } from "socket.io-parser";
import superjson from "superjson";

const RESERVED_EVENTS = [
  "connect", // used on the client side
  "connect_error", // used on the client side
  "disconnect", // used on both sides
  "disconnecting", // used on the server side
  "newListener", // used by the Node.js EventEmitter
  "removeListener", // used by the Node.js EventEmitter
];

class CustomEncoder extends Encoder {
  constructor() {
    super();
  }

  encode(obj: Packet): [string] {
    // First is type
    let str = `${obj.type}`;

    // attachments if we have them
    if (
      (obj.type === PacketType.BINARY_EVENT ||
        obj.type === PacketType.BINARY_ACK) &&
      obj.attachments
    )
      str += obj.attachments.toString() + "-";

    // if we have a namespace other than `/`
    // we append it followed by a comma `,`
    if (obj.nsp && "/" !== obj.nsp) str += obj.nsp + ",";

    // immediately followed by the id
    if (obj.id) str += obj.id;

    // json data
    if (obj.data) str += superjson.stringify(obj.data);

    return [str];
  }
}

class CustomDecoder extends Decoder {
  constructor() {
    super();
  }

  public add(obj: object): void {
    if (typeof obj === "string") {
      super.emitReserved("decoded", this.decodeStringCustom(obj));
    } else {
      throw new Error(`Unknown type: ${typeof obj}`);
    }
  }

  private decodeStringCustom(str: string): Packet {
    let i = 0;
    // look up type
    const p: Packet = {
      type: Number(str.charAt(0)),
      nsp: "/",
    };

    if (PacketType[p.type] === undefined)
      throw new Error(`Unknown packet type ${p.type}`);

    // look up attachments if type binary
    if (
      p.type === PacketType.BINARY_EVENT ||
      p.type === PacketType.BINARY_ACK
    ) {
      const start = i + 1;
      while (str.charAt(++i) !== "-" && i !== str.length) {}
      const buf = str.substring(start, i);
      if (buf !== Number(buf).toString() || str.charAt(i) !== "-") {
        throw new Error("Illegal attachments");
      }
      p.attachments = Number(buf);
    }

    // look up namespace (if any)
    if ("/" === str.charAt(i + 1)) {
      const start = i + 1;
      while (++i) {
        const c = str.charAt(i);
        if ("," === c) break;
        if (i === str.length) break;
      }
      p.nsp = str.substring(start, i);
    }

    // look up id
    const next = str.charAt(i + 1);
    if ("" !== next && Number(next).toString() === next) {
      const start = i + 1;
      while (++i) {
        const c = str.charAt(i);
        if (c === null || Number(c).toString() !== c) {
          --i;
          break;
        }
        if (i === str.length) break;
      }
      p.id = Number(str.substring(start, i + 1));
    }

    // look up json data
    if (str.charAt(++i)) {
      const payload = this.tryParseCustom(str.substring(i));
      if (CustomDecoder.isPayloadValidCustom(p.type, payload)) {
        p.data = payload;
      } else {
        throw new Error("Invalid payload");
      }
    }

    return p;
  }

  private tryParseCustom(str: string): boolean {
    try {
      return superjson.parse(str);
    } catch (e) {
      return false;
    }
  }

  private static isPayloadValidCustom(
    type: PacketType,
    payload: unknown
  ): boolean {
    const isObject = (value: unknown) => {
      return Object.prototype.toString.call(value) === "[object Object]";
    };

    switch (type) {
      case PacketType.CONNECT:
        return isObject(payload);
      case PacketType.DISCONNECT:
        return payload === undefined;
      case PacketType.CONNECT_ERROR:
        return typeof payload === "string" || isObject(payload);
      case PacketType.EVENT:
      case PacketType.BINARY_EVENT:
        return (
          Array.isArray(payload) &&
          (typeof payload[0] === "number" ||
            (typeof payload[0] === "string" &&
              RESERVED_EVENTS.indexOf(payload[0]) === -1))
        );
      case PacketType.ACK:
      case PacketType.BINARY_ACK:
        return Array.isArray(payload);
    }
  }
}

const parser = { Encoder: CustomEncoder, Decoder: CustomDecoder };

export default parser;
