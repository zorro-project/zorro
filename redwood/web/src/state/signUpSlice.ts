import {createSlice, PayloadAction} from '@reduxjs/toolkit'

type SignUpState = {
  // CID or local URL of the profile's avatar photo
  photo?: string

  // CID or local URL of the profile's avatar video
  video?: string
}

const initialState: SignUpState = {}

export const signUpSlice = createSlice({
  name: 'signUp',
  initialState,
  reducers: {
    setPhoto: (state, action: PayloadAction<SignUpState['photo']>) => {
      state.photo = action.payload
    },
    setVideo: (state, action: PayloadAction<SignUpState['video']>) => {
      state.video = action.payload
    },
  },
})
