import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { z } from "zod";
import {
  useForm,
  Controller,
  type SubmitHandler,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/utils/api";
import { TRPCClientError } from "@trpc/client";
import { P, match } from "ts-pattern";

const schema = z.object({
  text: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

const AddMessageForm: React.FC<{ onMessagePost: () => void }> = ({
  onMessagePost,
}) => {
  // Next-Auth hooks
  const { data: session } = useSession();

  // TRPC hooks
  const addPost = api.post.add.useMutation();
  const isTyping = api.post.isTyping.useMutation();

  // Form hooks
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      text: "",
    },
  });

  // React hooks
  const [enterToPostMessage, setEnterToPostMessage] = useState(true);

  // Event handlers
  const onSubmit: SubmitHandler<FormValues> = async (
    data,
    event?: React.BaseSyntheticEvent
  ) => {
    try {
      event?.preventDefault();

      await addPost.mutateAsync({
        text: data.text,
      });

      reset();
      onMessagePost();
    } catch (error) {
      if (!(error instanceof TRPCClientError)) throw error;

      console.error(error.message);
    }
  };

  const onKeyDownCustom: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    event
  ) => {
    if (event.key === "Shift") setEnterToPostMessage(false);

    if (event.key === "Enter" && enterToPostMessage)
      void handleSubmit(onSubmit)(event);

    isTyping.mutate({ typing: true });
  };

  const onKeyUpCustom: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    event
  ) => {
    if (event.key === "Shift") setEnterToPostMessage(true);
  };

  const onBlurCustom: React.FocusEventHandler<HTMLTextAreaElement> = () => {
    setEnterToPostMessage(true);
    isTyping.mutate({ typing: false });
  };

  const handleFormErrors = (errors: FieldErrors<FormValues>) =>
    match(errors)
      .with({ text: P.not(undefined) }, () => (
        <p style={{ color: "red" }}>Text is required</p>
      ))
      .otherwise(() => null);

  if (!session)
    return (
      <div className="flex w-full justify-between rounded bg-gray-800 px-3 py-2 text-lg text-gray-200">
        <p className="font-bold">
          You have to{" "}
          <button
            className="inline font-bold underline"
            onClick={() => void signIn()}
          >
            sign in
          </button>{" "}
          to write.
        </p>
        <button
          onClick={() => void signIn()}
          data-testid="signin"
          className="h-full rounded bg-indigo-500 px-4"
        >
          Sign In
        </button>
      </div>
    );

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <fieldset disabled={addPost.isLoading} className="min-w-0">
        <div className="flex w-full items-end rounded bg-gray-500 px-3 py-2 text-lg text-gray-200">
          <Controller
            name="text"
            control={control}
            render={({ field }) => (
              <textarea
                className="flex-1 bg-transparent outline-0"
                autoFocus
                onKeyDown={onKeyDownCustom}
                onKeyUp={onKeyUpCustom}
                {...field}
                onBlur={onBlurCustom}
              />
            )}
          ></Controller>
          <div>
            <button type="submit" className="rounded bg-indigo-500 px-4 py-1">
              Submit
            </button>
          </div>
        </div>
      </fieldset>
      {handleFormErrors(errors)}
    </form>
  );
};

export default AddMessageForm;
