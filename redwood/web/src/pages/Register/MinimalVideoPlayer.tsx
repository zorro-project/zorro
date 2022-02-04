import React, {useState} from 'react'
import ReactPlayer from 'react-player'
import {Box, Icon, Center} from '@chakra-ui/react'
import {FaPlay} from 'react-icons/fa'

const MinimalVideoPlayer = (
  props: Omit<ReactPlayer['props'], 'width' | 'height' | 'playing'> & {
    playOnLoad?: boolean
  }
) => {
  const {playOnLoad = false, onEnded, ...rest} = props
  const [isPlaying, setIsPlaying] = useState(playOnLoad)
  const stopPlaying = () => setIsPlaying(false)
  const togglePlaying = () => setIsPlaying((value) => !value)
  return (
    <Box position="relative" h="100%" w="100%">
      <ReactPlayer
        {...rest}
        width="100%"
        height="100%"
        playing={isPlaying}
        onEnded={() => {
          stopPlaying()
          onEnded?.()
        }}
      />

      <Center
        onClick={togglePlaying}
        position="absolute"
        left="0"
        right="0"
        bottom="0"
        top="0"
        backgroundColor="rgba(0,0,0,0.2)"
        _hover={{backgroundColor: 'rgba(0,0,0,0.3)'}}
        cursor="pointer"
        opacity={isPlaying ? 0 : 1}
      >
        <Icon as={FaPlay} w={20} h={20} color="white" opacity={0.65} />
      </Center>
    </Box>
  )
}

export default MinimalVideoPlayer
