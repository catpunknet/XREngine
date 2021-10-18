import React, { useState, useRef, useEffect } from 'react'
import ListItemAvatar from '@material-ui/core/ListItemAvatar'
import IconButton from '@material-ui/core/IconButton'
import Call from '@material-ui/icons/Call'
import MoreHoriz from '@material-ui/icons/MoreHoriz'
import { useStyle, useStyles } from './style'
import InviteHarmony from '../inviteHarmony'
import Person from '@material-ui/icons/Person'
import ListItemText from '@material-ui/core/ListItemText'
import { useDispatch } from '../../../store'
import { ChatService } from '../../../social/state/ChatService'
import { useChatState } from '../../../social/state/ChatState'
import { useAuthState } from '../../../user/state/AuthState'
import { useUserState } from '../../../user/state/UserState'
import { ChatAction } from '../../../social/state/ChatActions'
import { useChannelConnectionState } from '@xrengine/client-core/src/common/state/ChannelConnectionState'
import { store } from '@xrengine/client-core/src/store'

import CreateMessage from './CreateMessage'
import MessageList from './MessageList'

export default function RightHarmony() {
  const classex = useStyle()
  const classes = useStyles()
  const [openInvite, setOpenInvite] = React.useState(false)
  const dispatch = store.dispatch
  const userState = useUserState()

  const messageRef = React.useRef()
  const messageEl = messageRef.current
  const selfUser = useAuthState().user
  const chatState = useChatState()
  const channelState = chatState.channels
  const channels = channelState.channels.value
  const channelConnectionState = useChannelConnectionState()
  const channelEntries = Object.values(channels).filter((channel) => !!channel)!
  const channelRef = useRef(channels)

  const instanceChannel = channelEntries.find((entry) => entry.instanceId != null)!
  const targetObject = chatState.targetObject
  const targetObjectType = chatState.targetObjectType
  const targetChannelId = chatState.targetChannelId.value
  const messageScrollInit = chatState.messageScrollInit
  const activeChannel = channels.find((c) => c.id === targetChannelId)!

  const openInviteModel = (open: boolean) => {
    setOpenInvite(open)
  }

  console.log('RRRRRRRRRR', activeChannel)

  useEffect(() => {
    if (channelState.updateNeeded) {
      ChatService.getChannels()
      ChatService.getChannelMessages(targetChannelId)
    }
  }, [channelState.updateNeeded])

  return (
    <div className={classes.rightRoot}>
      <div className={classes.title}>
        {activeChannel?.instance && (
          <ListItemAvatar>
            <Person />
          </ListItemAvatar>
        )}
        {activeChannel?.instance && (
          <ListItemText
            className={classes.listText}
            primary={activeChannel?.instance?.instanceUsers[0].name}
            secondary={<React.Fragment>{'online'}</React.Fragment>}
          />
        )}
        <div style={{ marginRight: '1.5rem' }}>
          <IconButton>
            <Call className={classes.whiteIcon} />
          </IconButton>
          <IconButton onClick={() => openInviteModel(true)}>
            <MoreHoriz className={classes.whiteIcon} />
          </IconButton>
        </div>
      </div>
      {activeChannel?.messages?.length > 0 && (
        <MessageList
          targetObjectType={targetObjectType}
          targetObject={targetObject}
          activeChannel={activeChannel}
          selfUser={selfUser}
          targetChannelId={targetChannelId}
        />
      )}
      {!(activeChannel?.messages?.length > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', height: '70%' }}>
          <div className={classes.firstMessagePlaceholder}>
            {targetObjectType.value === 'group' ? 'Create a group to start a chat within  ' : 'Start a chat with  '}
            {targetObjectType.value === 'user' || targetObjectType.value === 'group'
              ? targetObjectType.value
              : targetObjectType.value === 'instance'
              ? 'your current layer'
              : 'your current party'}
          </div>
        </div>
      )}
      <div style={{ position: 'fixed', bottom: '0' }}>
        <CreateMessage />
      </div>

      <InviteHarmony open={openInvite} handleClose={openInviteModel} />
    </div>
  )
}
