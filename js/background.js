;(function (i, s, o, g, r, a, m) {
  i["GoogleAnalyticsObject"] = r
  ;(i[r] =
    i[r] ||
    function () {
      ;(i[r].q = i[r].q || []).push(arguments)
    }),
    (i[r].l = 1 * new Date())
  ;(a = s.createElement(o)), (m = s.getElementsByTagName(o)[0])
  a.async = 1
  a.src = g
  m.parentNode.insertBefore(a, m)
})(window, document, "script", "https://www.google-analytics.com/analytics.js", "ga") // Note: https protocol here

ga("create", "UA-223075511-1", "auto") // Enter your GA identifier
ga("set", "checkProtocolTask", function () {}) // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
ga("require", "displayfeatures")

// chrome.runtime.onMessage.addListener(function (request) {
//   if (request === "get_contacts") {
//     const contact = []

//     let modulesMain = null
//     let tag = new Date().getTime()
//     console.log(webpackChunkwhatsapp_web_client)
//     webpackChunkwhatsapp_web_client.push([
//       ["parasite" + tag],
//       {},
//       function (o) {
//         let modules = []
//         for (let idx in o.m) {
//           let module = o(idx)
//           modules.push(module)
//         }
//         modulesMain = modules
//       },
//     ])
//     for (let idx in modulesMain) {
//       if (typeof modulesMain[idx] === "object" && modulesMain[idx] !== null) {
//         if (modulesMain[idx]?.default?.Chat) {
//           const contacts = modulesMain[idx].default.GroupMetadata.get("351932471330-1589217580@g.us").participants._models
//           for (let index in contacts) {
//             contact.push(contacts[index].__x_id.user)
//           }
//         }
//       }
//     }
//     console.log("contatos aqui")
//     console.log(request)
//   }
// })

var notifications = {
  type: "basic",
  iconUrl: "logo/large.png",
  title: "Whatsapp Boladão Plus Instalado",
  message: "clique para ver mais.",
}

chrome.runtime.onInstalled.addListener(async function (e) {
  send_notification("Whatsapp Boladão Plus Instalado", "")
})

chrome.runtime.setUninstallURL("https://ev.braip.com/pv/lipx919p/afi7lvpvq")

function messageListner() {
  chrome.runtime.onMessage.addListener(listner)
}

function listner(request, sender, sendResponse) {
  if (request.type === "send_notification") send_notification(request.title, request.message)
  if (request.type === "ga") {
    ga("send", "event", request.event, request.track)
  }
}

function send_notification(title, message) {
  notifications["titulo"] = title
  notifications["mensagem"] = message
  try {
    chrome.notifications.create(notifications, function (e) {})
  } catch (e) {}
}

function bcdinit() {
  messageListner()
  chrome.identity.getProfileUserInfo(function (userinfo) {
    chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
      if (request.type === "get_contacts") {
        const contact = []
        let modulesMain = null
        let tag = new Date().getTime()
        console.log(webpackChunkwhatsapp_web_client)
        return sendResponse({ contact: `${typeof webpackChunkwhatsapp_web_client}, peixe` })
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
              const contacts = modulesMain[idx].default.GroupMetadata.get("351932471330-1589217580@g.us").participants._models
              contacts.forEach((g) => {
                console.log(g.__x_id.user)
              })
            }
          }
        }
      }
      sendResponse({ email: userinfo.email })
    })
  })
}

bcdinit()
