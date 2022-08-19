When using Next.js, of course you can use hooks like `useLazyLoadQuery` to fetch your data:

```tsx
import { graphql, useLazyLoadQuery } from "react-relay";

const query = graphql`
  query MyComponentQuery {
    field
  }
`;

export default function MyComponent() {
  const data = useLazyLoadQuery(query, {});

  // ...
}
```

However this will force the page component to render on the client. If you want to fetch data on the server, for example using `getServerSideProps` or `getStaticProps`, you need to change how and where you fetch this data.

If you have setup your project using `create-relay-app`, most of the pieces for this should already be in place and you only need to add a `getServerSideProps` or `getStaticProps` to your component file:

```tsx
import { graphql, fetchQuery } from "relay-runtime";
import { initRelayEnvironment } from "../src/RelayEnvironment";
import type { GetServerSideProps, NextPage } from "next";
import type { RecordMap } from "relay-runtime/lib/store/RelayStoreTypes";
import type {
  MyComponentQuery,
  MyComponentQuery$data,
} from "../__generated__/MyComponentQuery.graphql";

const query = graphql`
  query MyComponentQuery {
    field
  }
`;

type Props = {
  data: MyComponentQuery$data;
};

// Notice how we are not using PropsWithRecords<Props>,
// since the `initialRecords` are irrelevant for the component itself.
const MyComponent: NextPage<Props> = ({ data }) => {
  // ...
};

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
  const observable = fetchQuery<MyComponentQuery>(environment, query, {});
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

export default MyComponent;
```
