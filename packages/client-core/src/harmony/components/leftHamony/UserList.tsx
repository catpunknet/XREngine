import React from 'react'
import Button from '@material-ui/core/Button'
import GroupAdd from '@material-ui/icons/GroupAdd'
import { useUserState } from '../../../user/state/UserState'
import { useAuthState } from '../../../user/state/AuthState'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import Divider from '@material-ui/core/Divider'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemAvatar from '@material-ui/core/ListItemAvatar'
import Avatar from '@material-ui/core/Avatar'
import { useGroupState } from '../../../social/state/GroupState'
import { useFriendState } from '../../../social/state/FriendState'
import { usePartyState } from '../../../social/state/PartyState'
import { ChatService } from '../../../social/state/ChatService'
import { useDispatch } from '../../../store'
import InviteHarmony from '../inviteHarmony'
import CreateGroup from './CreateGroup'
import { useUserStyles } from './style'

const UserList = ({ chatType }) => {
  const [openInvite, setOpenInvite] = React.useState(false)
  const dispatch = useDispatch()
  const classes = useUserStyles()
  const userState = useUserState()
  const groupState = useGroupState()
  const selfUser = useAuthState().user
  const groupSubState = groupState.groups
  const groups = groupSubState.groups.value
  const friendState = useFriendState()
  const friendSubState = friendState.friends
  const friends = friendSubState.friends.value
  const party = usePartyState().party.value
  const instanceLayerUsers = userState.layerUsers.value
  const [openCreateGroupModel, setOpenCreateGroupModel] = React.useState(false)

  const toggleCreateGroupModel = (open: boolean) => {
    setOpenCreateGroupModel(open)
  }

  const openInviteModel = (open: boolean) => {
    setOpenInvite(open)
  }

  let data
  switch (chatType) {
    case 'Group':
      data = groups
      break
    case 'Freinds':
      data = friends
      break
    case 'Party':
      data = party
      break
    case 'Layer':
      data = instanceLayerUsers
      break
    case 'Instance':
      data = { id: selfUser.instanceId.value }
      break
    default:
      data = []
      break
  }
  if (data) {
    dispatch(ChatService.updateChatTarget(chatType.toLowerCase(), data))
  }

  return (
    <div>
      {chatType === 'Group' ? (
        <Button
          variant="contained"
          color="secondary"
          style={{ marginBottom: '4rem', marginLeft: '4rem' }}
          startIcon={<GroupAdd />}
          onClick={() => toggleCreateGroupModel(true)}
        >
          Create Group
        </Button>
      ) : (
        ''
      )}
      <List className={classes.root}>
        {data && data.length > 0 ? (
          data.map((el) => {
            return (
              <div key={el.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>{el.name.slice(0, 1).toLocaleUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    style={{ backgroundColor: '#43484F' }}
                    primary={selfUser.value.id === el.id ? `${el.name} (you)` : el.name}
                    secondary={<React.Fragment>{el.description}</React.Fragment>}
                  />
                </ListItem>

                <Divider variant="fullWidth" component="li" style={{ backgroundColor: '#15171B' }} />
              </div>
            )
          })
        ) : (
          <Button
            variant="contained"
            color="secondary"
            style={{ marginTop: '4rem', marginLeft: '4rem' }}
            startIcon={<GroupAdd />}
            onClick={() => openInviteModel(true)}
          >
            Invite
          </Button>
        )}
      </List>
      <InviteHarmony open={openInvite} handleClose={openInviteModel} />
      <CreateGroup open={openCreateGroupModel} handleClose={toggleCreateGroupModel} />
    </div>
  )
}

export default UserList
