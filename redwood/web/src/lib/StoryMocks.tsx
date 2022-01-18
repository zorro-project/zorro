import {Store} from '@reduxjs/toolkit'
import {merge} from 'lodash'
import {Provider} from 'react-redux'
import UserContext, {
  defaultValue,
  UserContextType,
} from 'src/layouts/UserContext'
import store, {RootState} from 'src/state/store'
import {PartialDeep} from 'type-fest'

const baseState: RootState = store.getState()

export const StoryMocks: React.FC<{
  user?: Partial<UserContextType>
  state?: PartialDeep<RootState>
}> = ({children, user, state}) => {
  const mergedState: RootState = merge({}, baseState, state)

  // @ts-expect-error Mock Redux store
  const mockStore: Store = {
    getState: () => mergedState,
    dispatch: (action) => action,
    subscribe: () => () => {},
  }

  return (
    <UserContext.Provider value={merge({}, defaultValue, user)}>
      <Provider store={mockStore}>{children}</Provider>
    </UserContext.Provider>
  )
}
