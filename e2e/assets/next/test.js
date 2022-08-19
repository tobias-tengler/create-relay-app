import { graphql, fetchQuery } from "relay-runtime";
import { initRelayEnvironment } from "../src/RelayEnvironment";

const query = graphql`
  query testQuery {
    field
  }
`;

export default function Test({ data }) {
  return <div id="test-data">{data.field}</div>;
}

export const getServerSideProps = async () => {
  // Get a fresh environment.
  const environment = initRelayEnvironment();

  // Execute the query.
  const observable = fetchQuery(environment, query, {});
  const data = await observable.toPromise();

  // Get the records that the query added to the store.
  const initialRecords = environment.getStore().getSource().toJSON();

  return {
    props: {
      // Pass the result of the query to your component
      data: data,
      // This is not intended for your component,
      // but it will be used by the _app component
      // to hydrate the Relay store on the client.
      //
      // IMPORTANT: The property name needs to be
      // `initialRecords`, otherwise the _app
      // component can not extract it.
      initialRecords,
    },
  };
};
