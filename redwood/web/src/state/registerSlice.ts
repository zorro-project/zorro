import {createSlice, PayloadAction} from '@reduxjs/toolkit'

type RegisterState = {
  // CID or local URL of the profile's avatar photo
  photo?: string

  // CID or local URL of the profile's avatar video
  video?: string

  // Best guess at the webcam's aspect ratio
  aspectRatio?: number
}

const initialState: RegisterState = {}

export const registerSlice = createSlice({
  name: 'register',
  initialState,
  reducers: {
    setPhoto: (state, action: PayloadAction<RegisterState['photo']>) => {
      state.photo = action.payload
    },
    setVideo: (state, action: PayloadAction<RegisterState['video']>) => {
      state.video = action.payload
    },
    setAspectRatio: (state, action: PayloadAction<number>) => {
      state.aspectRatio = action.payload
    },
    resetForm: (state) => {
      state.photo = undefined
      state.video = undefined
    },
  },
})
