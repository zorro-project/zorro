import {Box, Flex, Heading} from '@chakra-ui/layout'
import {MetaTags, useQuery} from '@redwoodjs/web'
import React from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import {FixedSizeGrid} from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import {ProfilesPageQuery} from 'types/graphql'
import {useWindowSize} from 'usehooks-ts'
import ProfileCard, {ItemType} from './ProfileCard'

const QUERY = gql`
  query ProfilesPageQuery($cursor: ID) {
    optimisticallyApprovedRegs {
      __typename
      ethereumAddress
      photoCid
      reviewedAt
    }

    cachedProfiles(first: 20, cursor: $cursor) {
      id
      edges {
        node {
          __typename
          ethereumAddress
          photoCid
          submissionTimestamp
          id
          isVerified
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

const ProfilesPage = () => {
  const {data, loading, fetchMore} = useQuery<ProfilesPageQuery>(QUERY, {
    notifyOnNetworkStatusChange: true,
    variables: {cursor: null},
  })

  const {width: windowWidth} = useWindowSize()

  const loadMore = React.useCallback(() => {
    !loading &&
      fetchMore({
        query: QUERY,
        variables: {
          cursor: data?.cachedProfiles?.pageInfo?.endCursor || null,
        },
        updateQuery: (previousResult, {fetchMoreResult}): ProfilesPageQuery => {
          if (!fetchMoreResult?.cachedProfiles) return previousResult

          const newEdges = fetchMoreResult.cachedProfiles.edges
          const pageInfo = fetchMoreResult.cachedProfiles.pageInfo

          // return previousResult
          return newEdges.length
            ? {
                optimisticallyApprovedRegs:
                  previousResult.optimisticallyApprovedRegs,
                cachedProfiles: {
                  ...fetchMoreResult.cachedProfiles,
                  edges: [
                    ...(previousResult.cachedProfiles?.edges ?? []),
                    ...fetchMoreResult.cachedProfiles.edges,
                  ],
                  pageInfo,
                },
              }
            : previousResult
        },
      })
  }, [fetchMore, data?.cachedProfiles?.pageInfo?.endCursor])

  const items: ItemType[] = (
    (data?.optimisticallyApprovedRegs ?? []) as ItemType[]
  ).concat(
    (data?.cachedProfiles?.edges?.map((edge) => edge?.node) ?? []) as ItemType[]
  )
  const hasNextPage = data?.cachedProfiles?.pageInfo?.hasNextPage

  const profilesCount = data?.cachedProfiles?.count ?? 0

  const pendingSubmissions = data?.optimisticallyApprovedRegs?.length ?? 0
  const itemsCount = profilesCount + pendingSubmissions

  const isItemLoaded = (index: number) => !hasNextPage || index < items.length

  if (data == null) return null

  return (
    <Flex flexDir="column" height="100vh" width="100%">
      <MetaTags title="All Profiles" />
      <Heading as="h1">All Profiles</Heading>

      <Box mx="-2" mt="6" flex={1}>
        <AutoSizer>
          {({width, height}) => {
            const minCardSize = windowWidth > 800 ? 200 : 150
            const columnCount = Math.floor(width / minCardSize)
            const rowCount = Math.ceil(itemsCount / columnCount)
            const cardSize = Math.floor(width / columnCount)

            return (
              <InfiniteLoader
                isItemLoaded={isItemLoaded}
                itemCount={itemsCount}
                loadMoreItems={loadMore}
              >
                {({onItemsRendered, ref}) => (
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
                    {({columnIndex, rowIndex, style}) => {
                      const idx = rowIndex * columnCount + columnIndex
                      if (idx >= items.length) return null
                      return <ProfileCard profile={items[idx]} style={style} />
                    }}
                  </FixedSizeGrid>
                )}
              </InfiniteLoader>
            )
          }}
        </AutoSizer>
      </Box>
    </Flex>
  )
}

export default ProfilesPage
