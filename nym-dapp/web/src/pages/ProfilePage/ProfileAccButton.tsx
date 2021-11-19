import { AccordionButton, Heading, AccordionIcon } from '@chakra-ui/react'

const ProfileAccButton: React.FC<{ text: string }> = ({ text }) => (
  <AccordionButton px="0">
    <Heading size="md" flex="1" textAlign="left">
      {text}
    </Heading>
    <AccordionIcon />
  </AccordionButton>
)

export default ProfileAccButton
