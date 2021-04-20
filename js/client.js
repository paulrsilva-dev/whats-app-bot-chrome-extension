window.addEventListener("ExtensionOptionsRead", function (event) {
  window.extensionOptions = event.detail
  console.log("window.extensionOptions ", window.extensionOptions)
})

window.addEventListener("message", (event) => {
  if (event.data.type === "get_contacts") {
    const contactList = []
    let modulesMain = null
    let tag = new Date().getTime()
    webpackChunkwhatsapp_web_client.push([
      ["parasite" + tag],
      {},
      function (o, e, t) {
        let modules = []
        for (let idx in o.m) {
          let module = o(idx)
          modules.push(module)
        }
        modulesMain = modules
      },
    ])
    for (let idx in modulesMain) {
      if (typeof modulesMain[idx] === "object" && modulesMain[idx] !== null) {
        if (modulesMain[idx]?.default?.Chat) {
          const groups = modulesMain[idx]?.default.ProfilePicThumb._models.filter((param) => {
            return param.__x_fallbackType === "GROUP"
          })
          const chats = modulesMain[idx]?.default.Chat._models.filter((chat) => {
            return chat.__x_isGroup === true
          })

          const name = document.getElementsByTagName("header")[1]?.childNodes[1]?.childNodes[0]?.childNodes[0]?.childNodes[0]?.title
          const groupFinder = groups.filter((group) => {
            return chats.filter((chat) => {
              if (group.__x_id.user === chat.__x_id.user) {
                group["__x_name"] = chat.__x_name
                return group.__x_id.user === chat.__x_id.user
              }
            })
          })
          const group = groupFinder.filter((group) => {
            return name === group.__x_name
          })

          const contacts = modulesMain[idx].default.GroupMetadata.get(group[0].__x_id._serialized).participants
          contacts.forEach((usr) => {
            contactList.push(`${usr?.__x_id.user},${usr?.__x_contact.__x_displayName}`)
          })
        }
      }
    }

    if (contactList.length === 0) {
      return alert(
        "Grupo não encontrado, certifique-se de estar com o chat aberto em um grupo, caso não resolva, aperte F5 para atualizar a página e recarregar o cache."
      )
    }

    let contactListString = "Contact Numbers,Name\n"
    contactListString += contactList.join("\n")

    const file = new Blob([contactListString], { type: "text/plain" })
    const url = URL.createObjectURL(file)
    const a = document.createElement("a")
    a.href = url
    a.download = "contatos.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
})
