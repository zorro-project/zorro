export const schema = gql`
  # TODO: figure out what statuses we want to expose
  enum ProfileStatus {
    submitted_via_notary
    challenged
    deemed_valid
    deemed_invalid
  }

  type CachedProfile {
    id: ID!
    address: ID!
    status: ProfileStatus!
    CID: String!
    photoCID: String
    videoCID: String
    submissionTimestamp: DateTime!
  }

  type PageInfo {
    endCursor: ID!
    hasNextPage: Boolean!
  }

  type CachedProfileEdge {
    cursor: ID!
    node: CachedProfile!
  }

  type CachedProfileConnection {
    id: ID! # This makes apollo-client happy
    edges: [CachedProfileEdge]
    pageInfo: PageInfo
    count: Int!
  }

  type Query {
    cachedProfiles(first: Int!, cursor: ID = 0): CachedProfileConnection
      @skipAuth

    cachedProfile(address: ID!): CachedProfile @skipAuth
  }
`
