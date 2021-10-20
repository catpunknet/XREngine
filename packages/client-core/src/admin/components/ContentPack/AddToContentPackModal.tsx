import classNames from 'classnames'
import React, { useState, useEffect } from 'react'
import { useDispatch } from '../../../store'
import { useContentPackState } from '../../state/ContentPackState'
import styles from './ContentPack.module.scss'
import { ContentPackService } from '../../state/ContentPackService'
import { Add, Edit } from '@mui/icons-material'
import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import Backdrop from '@mui/material/Backdrop'
import Button from '@mui/material/Button'
import Fade from '@mui/material/Fade'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Modal from '@mui/material/Modal'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import CircularProgress from '@mui/material/CircularProgress'

interface Props {
  open: boolean
  handleClose: any
  scenes?: any
  avatars?: any
  projects?: any
}

const AddToContentPackModal = (props: Props): any => {
  const { open, handleClose, avatars, scenes, projects } = props

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [createOrPatch, setCreateOrPatch] = useState('patch')
  const [contentPackName, setContentPackName] = useState('')
  const [newContentPackName, setNewContentPackName] = useState('')
  const contentPackState = useContentPackState()
  const contentPacks = contentPackState.contentPacks
  const dispatch = useDispatch()
  const showError = (err: string) => {
    setError(err)
    setTimeout(() => {
      setError('')
    }, 3000)
  }

  const handleCreateOrPatch = (event: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue) {
      setCreateOrPatch(newValue)
    }
  }

  const addCurrentScenesToContentPack = async () => {
    try {
      if (contentPackName !== '') {
        setProcessing(true)
        await dispatch(
          ContentPackService.addScenesToContentPack({
            scenes: scenes,
            contentPack: contentPackName
          })
        )
        setProcessing(false)
        window.location.href = '/admin/content-packs'
        closeModal()
      } else
        throw new Error(
          createOrPatch === 'patch'
            ? 'Must select an existing content pack'
            : 'Must enter a name for a new content pack'
        )
    } catch (err) {
      setProcessing(false)
      showError(err.message)
    }
  }

  const addCurrentAvatarsToContentPack = async () => {
    try {
      setProcessing(true)
      if (contentPackName !== '') {
        await dispatch(
          ContentPackService.addAvatarsToContentPack({
            avatars: avatars,
            contentPack: contentPackName
          })
        )
        setProcessing(false)
        window.location.href = '/admin/content-packs'
        closeModal()
      } else throw new Error('Existing content pack must be selected')
    } catch (err) {
      setProcessing(false)
      showError(err.message)
    }
  }

  const addCurrentProjectToContentPack = async () => {
    try {
      setProcessing(true)
      if (contentPackName !== '') {
        await dispatch(
          ContentPackService.addProjectToContentPack({
            projects,
            contentPack: contentPackName
          })
        )
        setProcessing(false)
        window.location.href = '/admin/content-packs'
        closeModal()
      } else throw new Error('Existing content pack must be selected')
    } catch (err) {
      setProcessing(false)
      showError(err.message)
    }
  }

  const createNewContentPack = async () => {
    try {
      setProcessing(true)
      if (newContentPackName !== '') {
        if (scenes != null)
          await dispatch(
            ContentPackService.createContentPack({
              scenes: scenes,
              contentPack: newContentPackName
            })
          )
        if (avatars != null)
          await dispatch(
            ContentPackService.createContentPack({
              avatars: avatars,
              contentPack: newContentPackName
            })
          )
        if (projects != null)
          await dispatch(
            ContentPackService.createContentPack({
              projects: projects,
              contentPack: newContentPackName
            })
          )
        setProcessing(false)
        window.location.href = '/admin/content-packs'
        closeModal()
      } else throw new Error('New content pack name required')
    } catch (err) {
      setProcessing(false)
      showError(err.message)
    }
  }

  const closeModal = () => {
    setContentPackName('')
    setNewContentPackName('')
    handleClose()
  }

  useEffect(() => {
    if (contentPackState.updateNeeded.value === true) {
      ContentPackService.fetchContentPacks()
    }
  }, [contentPackState.updateNeeded.value])

  return (
    <div>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        className={styles.modal}
        open={open}
        onClose={closeModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500
        }}
      >
        <Fade in={props.open}>
          <div
            className={classNames({
              [styles.paper]: true,
              [styles['modal-content']]: true
            })}
          >
            <div className={styles['modal-header']}>
              <div />
              {scenes && (
                <div className={styles['title']}>
                  Adding {scenes.length} {scenes.length === 1 ? 'Scene' : 'Scenes'}
                </div>
              )}
              {avatars && (
                <div className={styles['title']}>
                  Adding {avatars.length} {avatars.length === 1 ? 'Avatar' : 'Avatars'}
                </div>
              )}
              {projects && (
                <div className={styles['title']}>
                  Adding {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
                </div>
              )}
              <IconButton aria-label="close" className={styles.closeButton} onClick={handleClose} size="large">
                <CloseIcon />
              </IconButton>
            </div>
            <ToggleButtonGroup
              value={createOrPatch}
              exclusive
              onChange={handleCreateOrPatch}
              aria-label="Create or Edit Content Pack"
            >
              <ToggleButton value="patch" aria-label="Add to existing content pack">
                <Edit />
                Add to existing content pack
              </ToggleButton>
              <ToggleButton value="create" aria-label="Create new content pack">
                <Add />
                Create New Content Pack
              </ToggleButton>
            </ToggleButtonGroup>
            {processing === false && createOrPatch === 'patch' && (
              <div>
                <FormControl>
                  <InputLabel id="contentPackSelect">Content Pack</InputLabel>
                  <Select
                    className={styles['pack-select']}
                    labelId="Content Pack"
                    id="contentPackSelect"
                    value={contentPackName}
                    onChange={(e) => setContentPackName(e.target.value as string)}
                  >
                    {contentPacks.value.map((contentPack) => (
                      <MenuItem key={contentPack.name} value={contentPack.name}>
                        {contentPack.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    onClick={
                      scenes != null
                        ? addCurrentScenesToContentPack
                        : projects != null
                        ? addCurrentProjectToContentPack
                        : addCurrentAvatarsToContentPack
                    }
                  >
                    Update Content Pack
                  </Button>
                </FormControl>
              </div>
            )}
            {processing === false && createOrPatch === 'create' && (
              <div>
                <FormControl>
                  <TextField
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    id="newContentPack"
                    label="Content Pack Name"
                    placeholder="content_pack1"
                    name="name"
                    required
                    value={newContentPackName}
                    onChange={(e) => setNewContentPackName(e.target.value)}
                  />
                  <Button type="submit" variant="contained" color="primary" onClick={createNewContentPack}>
                    Create Content Pack
                  </Button>
                </FormControl>
              </div>
            )}
            {processing === true && (
              <div className={styles.processing}>
                <CircularProgress color="primary" />
                <div className={styles.text}>Processing</div>
              </div>
            )}
            {error && error.length > 0 && <h2 className={styles['error-message']}>{error}</h2>}
          </div>
        </Fade>
      </Modal>
    </div>
  )
}

export default AddToContentPackModal
