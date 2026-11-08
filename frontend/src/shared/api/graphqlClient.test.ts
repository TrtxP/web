import { test } from "node:test";
import assert from "node:assert/strict";
import { api } from "./httpClient.ts";
import { graphqlRequest, GraphQlRequestError } from "./graphqlClient.ts";

test("GraphQL HTTP preserves variables and the existing JWT interceptor", async () => {
  const previous = api.defaults.adapter;
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true,
    value: { getItem: () => "test-token" } });
  try {
    api.defaults.adapter = async (config) => {
      assert.equal(config.url, "/graphql");
      assert.equal(config.headers.Authorization, "Bearer test-token");
      assert.deepEqual(JSON.parse(config.data), { query: "query Q($id: ID!) { q(id: $id) }", variables: { id: 7 } });
      return { status: 200, statusText: "OK", config, headers: {}, data: { data: { q: "result" } } };
    };
    assert.deepEqual(await graphqlRequest("query Q($id: ID!) { q(id: $id) }", { id: 7 }), { q: "result" });
    api.defaults.adapter = async (config) => ({ status: 200, statusText: "OK", config, headers: {},
      data: { data: null, errors: [{ message: "Forbidden", extensions: { classification: "FORBIDDEN" } }] } });
    await assert.rejects(graphqlRequest("{ chats { id } }"), GraphQlRequestError);
    api.defaults.adapter = async (config) => ({ status: 200, statusText: "OK", config, headers: {}, data: {} });
    await assert.rejects(graphqlRequest("{ chats { id } }"), /no data/);
  } finally {
    api.defaults.adapter = previous;
    if (storageDescriptor) Object.defineProperty(globalThis, "localStorage", storageDescriptor);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
