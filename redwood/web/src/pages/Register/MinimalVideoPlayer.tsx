import React, {useState} from 'react'
import ReactPlayer from 'react-player'
import {Box, Icon, Center} from '@chakra-ui/react'
import {FaPlay} from 'react-icons/fa'

const MinimalVideoPlayer = (props: ReactPlayer['props']) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const startPlaying = () => setIsPlaying(true)
  const stopPlaying = () => setIsPlaying(false)
  return (
    <Box position="relative" h="100%" w="100%">
      <ReactPlayer {...props} playing={isPlaying} onEnded={stopPlaying} />

      {!isPlaying && (
        <Center
          onClick={startPlaying}
          sx={{
            position: 'absolute',
            backgroundColor: 'rgba(0,0,0,0.2)',
            left: 0,
            top: 0,
            bottom: 0,
            right: 0,
            cursor: 'pointer',
            _hover: {backgroundColor: 'rgba(0,0,0,0.3)'},
          }}
        >
          <Icon as={FaPlay} w={20} h={20} color="white" opacity={0.65} />
        </Center>
      )}
    </Box>
  )
}

export default MinimalVideoPlayer
