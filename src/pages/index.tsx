import { type NextPage } from "next";
import Layout from "~/layout";
import { Container } from "@chakra-ui/react";

const Home: NextPage = () => {
  return (
    <Layout title="Home">
      <Container>Hello world</Container>
    </Layout>
  );
};

export default Home;
