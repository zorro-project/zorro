import { Box, Flex, Heading } from '@chakra-ui/layout'
import { MetaTags, useQuery } from '@redwoodjs/web'
import React from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeGrid } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import { Cached_Profiles } from 'types/graphql'
import ProfileCard from './ProfileCard'

const QUERY = gql`
  query CACHED_PROFILES($cursor: ID) {
    cachedProfiles(first: 20, cursor: $cursor) {
      id
      edges {
        node {
          ethAddress
          photoCID
          status
          createdTimestamp
          nymId
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      count
    }
  }
`

const MIN_CARD_SIZE = 200

const ProfilesPage = () => {
  const { data, loading, fetchMore } = useQuery<Cached_Profiles>(QUERY, {
    notifyOnNetworkStatusChange: true,
    variables: { cursor: null },
  })

  const loadMore = React.useCallback(
    () =>
      !loading &&
      fetchMore({
        query: QUERY,
        variables: {
          cursor: data?.cachedProfiles?.pageInfo?.endCursor || null,
        },
        updateQuery: (previousResult, { fetchMoreResult }): Cached_Profiles => {
          const newEdges = fetchMoreResult.cachedProfiles.edges
          const pageInfo = fetchMoreResult.cachedProfiles.pageInfo

          // return previousResult
          return newEdges.length
            ? {
                cachedProfiles: {
                  ...fetchMoreResult.cachedProfiles,
                  edges: [
                    ...previousResult.cachedProfiles.edges,
                    ...fetchMoreResult.cachedProfiles.edges,
                  ],
                  pageInfo,
                },
              }
            : previousResult
        },
      }),
    [fetchMore, data?.cachedProfiles?.pageInfo?.endCursor]
  )

  const profiles = data?.cachedProfiles?.edges?.map(({ node }) => node)
  const hasNextPage = data?.cachedProfiles?.pageInfo?.hasNextPage

  const profilesCount = data?.cachedProfiles?.count
  const isProfileLoaded = (index) => !hasNextPage || index < profiles.length

  if (data == null) return null

  return (
    <>
      <MetaTags title="Profiles" />
      <Flex flexDir="column" height="100vh" spacing={8}>
        <Heading as="h1">Nym Profiles</Heading>

        <Box mx="-2" mt="6" flex={1}>
          <AutoSizer>
            {({ width, height }) => {
              const columnCount = Math.floor(width / MIN_CARD_SIZE)
              const rowCount = Math.ceil(profilesCount / columnCount)
              const cardSize = Math.floor(width / columnCount)

              return (
                <InfiniteLoader
                  isItemLoaded={isProfileLoaded}
                  itemCount={profilesCount}
                  loadMoreItems={loadMore}
                >
                  {({ onItemsRendered, ref }) => (
                    <FixedSizeGrid
                      onItemsRendered={(gridProps) =>
                        onItemsRendered({
                          overscanStartIndex:
                            gridProps.overscanRowStartIndex * columnCount,
                          overscanStopIndex:
                            gridProps.overscanRowStopIndex * columnCount,
                          visibleStartIndex:
                            gridProps.visibleRowStartIndex * columnCount,
                          visibleStopIndex:
                            gridProps.visibleRowStopIndex * columnCount,
                        })
                      }
                      ref={ref}
                      height={height}
                      width={width}
                      rowHeight={cardSize}
                      columnCount={columnCount}
                      rowCount={rowCount}
                      columnWidth={cardSize}
                    >
                      {({ columnIndex, rowIndex, style }) => (
                        <Box style={style} p="2">
                          <ProfileCard
                            profile={
                              profiles[rowIndex * columnCount + columnIndex]
                            }
                          />
                        </Box>
                      )}
                    </FixedSizeGrid>
                  )}
                </InfiniteLoader>
              )
            }}
          </AutoSizer>
        </Box>
      </Flex>
    </>
  )
}

export default ProfilesPage
