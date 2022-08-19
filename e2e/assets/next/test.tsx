import { graphql, fetchQuery } from "relay-runtime";
import { initRelayEnvironment } from "../../src/RelayEnvironment";
import type { GetServerSideProps, NextPage } from "next";
import type { RecordMap } from "relay-runtime/lib/store/RelayStoreTypes";
import type {
  testQuery,
  testQuery$data,
} from "../../__generated__/testQuery.graphql";

const query = graphql`
  query testQuery {
    field
  }
`;

type Props = {
  data: testQuery$data;
};

// Notice how we are not using PropsWithRecords<Props>,
// since the `initialRecords` are irrelevant for the component itself.
const Test: NextPage<Props> = ({ data }) => {
  return <div id="test-data">{data.field}</div>;
};

export default Test;

// You can place this as a helper type wherever.
type PropsWithRecords<T> = T & {
  initialRecords: RecordMap;
};

export const getServerSideProps: GetServerSideProps<
  PropsWithRecords<Props>
> = async () => {
  // Get a fresh environment.
  const environment = initRelayEnvironment();

  // Execute the query.
  const observable = fetchQuery<testQuery>(environment, query, {});
  const data = await observable.toPromise();

  // Get the records that the query added to the store.
  const initialRecords = environment.getStore().getSource().toJSON();

  return {
    props: {
      // Pass the result of the query to your component
      data: data!,
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
