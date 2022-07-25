import { World } from '@xrengine/engine/src/ecs/classes/World'
import { addComponent, getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { PersistTagComponent } from '@xrengine/engine/src/scene/components/PersistTagComponent'
import { XRUIComponent } from '@xrengine/engine/src/xrui/components/XRUIComponent'
import { ObjectFitFunctions } from '@xrengine/engine/src/xrui/functions/ObjectFitFunctions'
import { WidgetName, Widgets } from '@xrengine/engine/src/xrui/Widgets'

import { createChatDetailView } from './ui/ChatDetailView'

export function createChatWidget(world: World) {
  const ui = createChatDetailView()

  addComponent(ui.entity, PersistTagComponent, true)

  ui.container.then(() => {
    const xrui = getComponent(ui.entity, XRUIComponent)
    ObjectFitFunctions.setUIVisible(xrui.container, false)
  })

  Widgets.registerWidget(world, ui.entity, {
    ui,
    label: WidgetName.CHAT,
    system: () => {}
  })
}
