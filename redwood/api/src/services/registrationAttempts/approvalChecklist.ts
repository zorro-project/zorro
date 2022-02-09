import type {Simplify} from 'type-fest'

export const registrationStatement =
  process.env.CHAIN_DEPLOYMENT === 'production'
    ? 'I swear this is my first time registering on Zorro'
    : "I swear that I'm registering on Zorro for testing purposes"

type NotaryField = {
  type: 'text' | 'number'
  label: string
}

type FieldType<T extends NotaryField['type']> = T extends 'text'
  ? string
  : T extends 'number'
  ? number
  : never

type NotaryFieldsType = Record<string, NotaryField>

type CompletedFields<FieldsT extends NotaryFieldsType> = Record<
  keyof FieldsT,
  FieldType<FieldsT[keyof FieldsT]['type']>
>

type ChecklistItem<FieldsT extends NotaryFieldsType> = {
  appliesTo: 'video' | 'photo' | 'general'

  // The short text that appears in the notary UI
  notaryTitle: string

  // The longer text that appears in the notary UI
  notaryDescription: string

  // URL of an image or video of a valid profile
  notaryGoodExample?: string

  // URL of an image or video of a profile that breaks this rule
  notaryBadExample?: string

  notaryFields?: FieldsT

  // The text to show to the user if they don't meet this checklist item
  userText: string | ((fields: CompletedFields<FieldsT>) => string)
}

// Use this constructor to ensure we get the right types for each item
const item = <FieldsT extends Record<string, NotaryField>>(
  item: ChecklistItem<FieldsT>
) => item

export const checklist = {
  // START PHOTO REQUIREMENTS
  photo_looking_at_camera: item({
    appliesTo: 'photo',
    notaryTitle: 'Looking at camera',
    notaryDescription:
      "Are the user's eyes open and looking directly at the camera?",
    userText: 'Please look directly at the camera.',
  }),
  photo_lighting_ok: item({
    appliesTo: 'photo',
    notaryTitle: 'Lighting OK',
    notaryDescription:
      "Is the lighting in the room bright enough to see all parts of the user's face without any dark shadows or excessive glare?",
    userText:
      'Please adjust the lighting in the room. Make sure you can see your whole face without any dark shadows or excessive glare.',
  }),
  photo_face_uncovered: item({
    appliesTo: 'photo',
    notaryTitle: 'Face uncovered',
    notaryDescription:
      "Is the user's face fully visible? No glasses, mask, heavy makeup, etc. Haircoverings are ok.",
    userText:
      'Make sure your face is fully visible. No glasses, mask, heavy makeup, etc. Haircoverings are ok.',
  }),
  photo_not_blurry: item({
    appliesTo: 'photo',
    notaryTitle: 'Not blurry',
    notaryDescription:
      'Is the picture in focus and high resolution? Would you be able to recognize this person from the photo?',
    userText:
      'Please make sure the picture is in focus and high resolution. You should be easy to recognize from the photo.',
  }),
  photo_face_size: item({
    appliesTo: 'photo',
    notaryTitle: 'Face large enough',
    notaryDescription: "Is the user's face large enough to easily see?",
    userText: 'Please make sure your face is large enough to easily see.',
  }),
  // END PHOTO REQUIREMENTS

  // START VIDEO REQUIREMENTS
  video_looking_at_camera: item({
    appliesTo: 'video',
    notaryTitle: 'Looking at camera',
    notaryDescription:
      "Are the user's eyes open and looking directly at the camera?",
    userText: 'Please look directly at the camera.',
  }),
  video_lighting_ok: item({
    appliesTo: 'video',
    notaryTitle: 'Lighting OK',
    notaryDescription:
      "Is the lighting in the room bright enough to see all parts of the user's face without any dark shadows or excessive glare?",
    userText:
      'Please adjust the lighting in the room. Make sure you can see your whole face without any dark shadows or excessive glare.',
  }),
  video_face_uncovered: item({
    appliesTo: 'video',
    notaryTitle: 'Face uncovered',
    notaryDescription:
      "Is the user's face fully visible? No glasses, mask, heavy makeup, etc. Haircoverings are ok.",
    userText:
      'Make sure your face is fully visible. No glasses, mask, heavy makeup, etc. Haircoverings are ok.',
  }),
  video_not_blurry: item({
    appliesTo: 'video',
    notaryTitle: 'Not blurry',
    notaryDescription:
      'Is the picture in focus and high resolution? Would you be able to recognize this person from the video?',
    userText:
      'Please make sure the picture is in focus and high resolution. You should be easy to recognize from the video.',
  }),
  video_face_size: item({
    appliesTo: 'video',
    notaryTitle: 'Face large enough',
    notaryDescription: "Is the user's face large enough to easily see?",
    userText: 'Please make sure your face is large enough to easily see.',
  }),
  video_says_phrase: item({
    appliesTo: 'video',
    notaryTitle: 'Says phrase',
    notaryDescription: `Can you easily tell that they are saying “${registrationStatement}”`,
    userText: `Please clearly say “${registrationStatement}” in your video.`,
  }),
  video_matches_photo: item({
    appliesTo: 'video',
    notaryTitle: 'Matches photo',
    notaryDescription:
      'Was the video recorded in the same location with the same backdrop as the photo?',
    userText:
      'Please record your video in the same location with the same backdrop as the photo. This helps us detect duplicate submissions.',
  }),

  // END VIDEO REQUIREMENTS

  // START GENERAL REQUIREMENTS
  custom_feedback: item({
    appliesTo: 'general',
    notaryTitle: 'Custom feedback',
    notaryDescription:
      'Is there any other reason this profile should be denied?',
    notaryFields: {
      custom_feedback: {
        type: 'text',
        label: 'Reason',
      },
    },
    userText: (fields) => fields.custom_feedback,
  }),
}

checklist['photo_face_size']

// type ChecklistSubmission
