export const schema = gql`
  enum ProfileStatus {
    submitted_via_notary
    challenged
    deemed_valid
    deemed_invalid
  }

  type CachedProfile {
    nymId: Int!
    ethAddress: String!
    status: ProfileStatus!
    CID: String!
    photoCID: String
    videoCID: String
    address: String
    createdTimestamp: DateTime!
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

    cachedProfile(id: ID!): CachedProfile @skipAuth
  }
`
