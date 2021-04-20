let my_number = null,
  logged_in_user = null

var rows = [],
  media_attached = false,
  notifications_hash = {},
  stop = false,
  contacts = [],
  contact_hash = {}
var SCROLL_INTERVAL = 600,
  SCROLL_INCREMENT = 450,
  AUTO_SCROLL = true,
  TOTAL_MEMBERS

var scrollInterval, observer, group_sidebar, header
var messages = ["Olá! Como podemos te ajudar?", "olá!", "Obrigado por usar o serviço!"],
  total_messages = 0

function initReport() {
  rows = [["Phone Number", "Result"]]
}

var s = document.createElement("script")
s.src = chrome.extension.getURL("js/client.js")
;(document.head || document.documentElement).appendChild(s)

function suggestion_messages() {
  var reply_div = document.getElementById("reply_div")
  if (reply_div) reply_div.parentNode.removeChild(reply_div)
  var smart_reply_edit_button = document.getElementById("smart_reply_edit_button")
  if (smart_reply_edit_button) smart_reply_edit_button.parentNode.removeChild(smart_reply_edit_button)
  var footer = document.querySelector("footer")
  if (!footer) return
  footer.style.paddingTop = "33px"
  var reply_div = document.createElement("div")
  reply_div.id = "reply_div"
  reply_div.style.position = "absolute"
  reply_div.style.padding = "8px 12px"
  reply_div.style.top = "0"
  reply_div.style.zIndex = "1"
  reply_div.style.width = "calc(100% - 80px)"
  $.each(messages, function (i, p) {
    var ps = p
    if (p.length > 47) var ps = p.substring(0, 47) + "..."
    var dom_node = $(
      $.parseHTML(
        '<button class="reply_click" style="color: var(--message-primary);background-color: var(--outgoing-background);border-radius: 15px;padding: 4px 8px;font-size: 12px;margin-right: 8px;margin-bottom: 4px;" value="' +
          p +
          '">' +
          ps +
          "</button>"
      )
    )
    reply_div.appendChild(dom_node[0])
  })
  total_messages = messages.length
  footer.appendChild(reply_div)
  footer.appendChild(
    $(
      $.parseHTML(
        '<button style="position: absolute;width: 80px;right: 8px;top: 12px;color: var(--message-primary);" id="smart_reply_edit_button">Edit</button>'
      )
    )[0]
  )

  var scrollWindow = document.getElementsByClassName("_33LGR")[0]
  if (scrollWindow) scrollWindow.scrollTop = scrollWindow.scrollHeight
  var btnContainer = document.getElementById("reply_div")
  btnContainer.addEventListener("click", function (event) {
    var message = event.target.value
    sendMessage(my_number, message)
    trackButtonClick("smart_reply_sent")
  })
  document.getElementById("smart_reply_edit_button").addEventListener("click", function (event) {
    suggestion_popup()
    trackButtonClick("smart_reply_edit")
  })
}

function referesh_messages() {
  var inner_div = document.getElementById("sugg_message_list")
  inner_div.innerHTML = ""
  $.each(messages, function (i, p) {
    var dom_node = $(
      $.parseHTML(
        '<div style="margin: 8px 0px;display: flex;"><div class="popup_list_message" style="color: var(--message-primary);background-color: var(--outgoing-background);padding: 6px 7px 8px 9px;border-radius: 7.5px;margin: 2px 0px;max-width: 400px;margin-right: 8px;cursor: pointer;overflow: auto;">' +
          p +
          "</div>" +
          '<button class="delete_message" style="border: 1px solid red;width: 18px;height: 18px;color: red;border-radius: 50%;font-size: 11px;margin-top: 8px;" value="' +
          p +
          '">X</button></div>'
      )
    )
    inner_div.appendChild(dom_node[0])
  })
  chrome.storage.local.set({ messages: messages })
}

function suggestion_popup() {
  if (!document.getElementsByClassName("modal")[0]) {
    var popup = document.createElement("div")
    popup.className = "modal"
    var modal_content = document.createElement("div")
    modal_content.className = "modal-content"
    modal_content.style.position = "relative"
    modal_content.style.width = "600px"
    modal_content.style.maxHeight = "560px"
    modal_content.style.overflow = "auto"
    popup.appendChild(modal_content)
    var body = document.querySelector("body")
    body.appendChild(popup)
    modal_content.appendChild(
      $($.parseHTML('<div style="font-weight: bold;font-size: 20px;text-align: center;margin-bottom: 24px;color: #000;">Editar/Adicionar respostas rápidas</div>'))[0]
    )
    var inner_div = document.createElement("div")
    inner_div.id = "sugg_message_list"
    inner_div.style.height = "210px"
    inner_div.style.overflowY = "auto"
    inner_div.style.margin = "16px 0px"
    modal_content.appendChild(inner_div)
    referesh_messages()
    modal_content.appendChild($($.parseHTML('<span id="close_edit" style="position: absolute;top: 4px;right: 12px;font-size: 20px;">&times;</span>'))[0])
    modal_content.appendChild($($.parseHTML('<textarea style="width: 400px;height: 100px;padding: 8px;" type="text" id="add_message"> </textarea>'))[0])
    modal_content.appendChild(
      $($.parseHTML('<button style="background: #00C451;border-radius: 2px;padding: 8px 12px;float: right;" id="add_message_btn">Adicionar modelo</button>'))[0]
    )

    modal_content.appendChild(
      $(
        $.parseHTML(
          '<div style="font-size: 16px;color: black;margin: 12px auto;font-weight: bold;"><span>Powered by</span> <a href="https://www.whatsappboladao.com" target="_blank" style="color: #00C451;text-decoration: unset;font-weight: normal;"> WA Web Sender</a><a href="https://wawebsender.blogspot.com/2021/07/how-to-reply-quickly-to-your-customers.html" style="float: right;color: #C4C4C4;text-decoration: underline;font-weight: normal;">How to use?</a></div>'
        )
      )[0]
    )

    document.getElementById("close_edit").addEventListener("click", function (event) {
      document.getElementsByClassName("modal")[0].style.display = "none"
    })
    document.getElementById("sugg_message_list").addEventListener("click", function (event) {
      var nmessage = event.target.value
      if (event.target.localName != "div") {
        var index = messages.indexOf(nmessage)
        messages.splice(index, 1)
        referesh_messages()
        trackButtonClick("smart_reply_deleted")
      } else if (event.target.localName == "div" && event.target.className == "popup_list_message") {
        document.getElementsByClassName("modal")[0].style.display = "none"
        sendMessage(my_number, event.target.innerHTML)
        trackButtonClick("smart_reply_sent")
      }
    })
    document.getElementById("add_message_btn").addEventListener("click", function (event) {
      var nmessage = document.getElementById("add_message").value
      if (nmessage !== "") {
        messages.push(nmessage)
        referesh_messages()
        document.getElementById("add_message").value = ""
        trackButtonClick("smart_reply_added")
      }
    })
  } else {
    document.getElementsByClassName("modal")[0].style.display = "block"
  }
}

function reload_mynumber() {
  my_number = (localStorage.getItem("last-wid") || localStorage.getItem("last-wid-md")).split(":")[0].replace(/"/g, "")
  // trackEvent('visit', my_number);
}

function init() {
  messageListner()
  initReport()
  window.onload = function () {
    if (window.location.host !== "web.whatsapp.com") window.open("https://web.whatsapp.com", "_blank")
    else {
      reload_mynumber()
      chrome.storage.local.get(["messages"], function (result) {
        if (result.messages) messages = result.messages
      })
      setInterval(() => {
        var reply_div = document.getElementById("reply_div")
        if (!reply_div || messages.length !== total_messages) {
          suggestion_messages()
        }
      }, 2000)
    }
  }
  chrome.extension.sendMessage({}, function (response) {
    logged_in_user = response.email
    trackEvent("loggedin", logged_in_user)
  })
}

function messageListner() {
  chrome.runtime.onMessage.addListener(listner)
}

function listner(request, sender, sendResponse) {
  if (request.type === "download_group") download_group()
  else if (request.type === "sheet") process_sheet(request.data, request.message)
  else if (request.type === "attachment") attachMedia(request.media_type)
  else if (request.type === "download_report") download_report()
  else if (request.type === "number_message")
    messanger(
      request.numbers,
      request.message,
      request.time_gap,
      request.csv_data,
      request.customization,
      request.random_delay,
      request.batch_size,
      request.batch_gap
    )
  else if (request.type === "schedule_message")
    schedule_message(
      request.numbers,
      request.message,
      request.time_gap,
      request.csv_data,
      request.customization,
      request.schedule_time,
      request.random_delay,
      request.batch_size,
      request.batch_gap
    )
  else if (request.type === "help") help()
  else if (request.type === "stop") {
    stop = true
  }
}

function sendChromeMessage(message) {
  chrome.runtime.sendMessage(message)
}

async function process_sheet(data, message) {
  var numbers = []
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].length; j++) {
      numbers.push(data[i][j])
    }
  }
  messanger(numbers, message)
}

async function help() {
  await openNumber("553172074286")
  var message = "Olá, preciso de ajuda para usar o Whats Boladão Plus"
  ;(messageBox = document.querySelectorAll("[contenteditable='true']")[1]),
    (event = document.createEvent("UIEvents")),
    (messageBox.innerHTML = message.replace(/ /gm, " ")),
    event.initUIEvent("input", !0, !0, window, 1),
    messageBox.dispatchEvent(event)
}

async function setMessages(message, csv_data) {
  var messages = []
  for (var i = 1; i < csv_data.length; i++) {
    var temp_message = message
    for (var j = 0; j < csv_data[0].length; j++) {
      var variable = csv_data[0][j]
      var curr_text = csv_data[i][j]
      temp_message = temp_message.replaceAll("{{" + variable + "}}", curr_text)
    }
    messages.push(temp_message)
  }
  return messages
}

async function messanger(numbers, message, time_gap, csv_data, customization, random_delay, batch_size, batch_gap) {
  initReport()
  trackEvent("time_gap", time_gap)
  trackEvent("batch_size", batch_size)
  trackEvent("random_delay", random_delay)
  trackEvent("batch_gap", batch_gap)

  if (customization) {
    var messages = await setMessages(message, csv_data)
  }
  var delays = [],
    total_time = 0,
    remaining_time = 0
  for (let i = 0; i < numbers.length; i++) {
    var curr_time_gap = time_gap
    if (random_delay) curr_time_gap = getRandomNumber(2, 7)
    if (batch_size && i % batch_size === 0) curr_time_gap = batch_gap
    if (i === 0) curr_time_gap = 1
    total_time += curr_time_gap
    delays.push(curr_time_gap)
  }
  remaining_time = total_time
  messanger_popup()
  for (let i = 0; i < numbers.length; i++) {
    if (stop) {
      stop = false
      break
    }
    var number = numbers[i]
    number = number.replace(/\D/g, "")
    var messanger_sending = document.getElementsByClassName("messanger_sending")[0]
    if (messanger_sending) {
      messanger_sending.innerHTML = ""
      messanger_sending.appendChild(
        $(
          $.parseHTML(
            '<div style="margin: auto;display: flex; width: 342px;"><span class="mail_icon"></span>Atualmente enviando para:  <strong style="padding: 0px 12px;">' +
              number +
              "</strong>  ( " +
              (i + 1) +
              " of " +
              numbers.length +
              " )</div>"
          )
        )[0]
      )
    }
    if (customization) message = messages[i]
    var a = null
    if (number.length < 10) {
      rows.push([numbers[i], "Invalid Number"])
      continue
    }
    try {
      remaining_time -= delays[i]
      a = await openNumber(number, delays[i])
    } catch (e) {
      continue
    }
    var messanger_time_bar = document.getElementsByClassName("messanger_time_bar")[0]
    if (messanger_time_bar) {
      messanger_time_bar.innerHTML = ""
      var remaining_bar = (1 - remaining_time / total_time) * 100
      if (i === 0) remaining_bar = 0
      var hours = Math.floor(remaining_time / 3600)
      var mins = Math.ceil(remaining_time / 60) % 60
      var remaining_time_str =
        "Aproxi. " + (hours > 0 ? hours + (hours > 1 ? " horas " : " hora ") : "") + mins + (mins > 1 ? " minutos " : " minuto ") + "remanescente"
      messanger_time_bar.appendChild(
        $(
          $.parseHTML(
            '<div style="width: 400px;color: #fff;position: absolute;text-align: center;font-weight: normal;font-size: 12px;padding: 4px;">' +
              remaining_time_str +
              "</div>"
          )
        )[0]
      )
      messanger_time_bar.appendChild(
        $($.parseHTML('<div style="width: ' + remaining_bar + '%;background: #357A71;height: 100%;border-radius: 16px;"></div>'))[0]
      )
    }
    if (!a) {
      rows.push([numbers[i], "Número inválido"])
      continue
    } else if (!message) {
      rows.push([numbers[i], "Mensagem inválida"])
    } else if (message) {
      await sendMessage(number, message)
      rows.push([number, "Mensagem enviada"])
    }

    if (media_attached) {
      await sendAttachment(number)
    }
  }
  media_attached = false
  notifications_hash["type"] = "send_notification"
  notifications_hash["title"] = "Suas mensagens foram enviadas"
  notifications_hash["message"] = "Abra a extensão para baixar o relatório"
  sendChromeMessage(notifications_hash)
  var messanger_popup_div = document.getElementsByClassName("messanger_popup")[0]
  if (messanger_popup_div) messanger_popup_div.style.display = "none"
}

function messanger_popup() {
  var messanger_popup_div = document.getElementsByClassName("messanger_popup")[0]
  if (!messanger_popup_div) {
    var popup = document.createElement("div")
    popup.className = "messanger_popup"
    var modal_content = document.createElement("div")
    modal_content.className = "messanger_popup_content"
    popup.appendChild(modal_content)
    modal_content.appendChild($($.parseHTML('<div class="popup_text_title"><span class="watch_icon"></span>Suas mensagens estão sendo enviadas</div>'))[0])
    modal_content.appendChild($($.parseHTML('<div class="messanger_time_bar" style="margin: 24px;"></div>'))[0])
    modal_content.appendChild($($.parseHTML('<div class="messanger_sending"></div>'))[0])

    var body = document.querySelector("body")
    body.appendChild(popup)
    modal_content.appendChild($($.parseHTML('<span id="close_edit1" style="position: absolute;top: 4px;right: 12px;font-size: 20px;">&times;</span>'))[0])
    document.getElementById("close_edit1").addEventListener("click", function (event) {
      document.getElementsByClassName("messanger_popup")[0].style.display = "none"
    })
  } else messanger_popup_div.style.display = "block"
}

function getRandomNumber(min, max) {
  return Math.ceil(Math.random() * (max - min) + min)
}

async function schedule_message(numbers, message, time_gap, csv_data, customization, schedule_time, random_delay, batch_size, batch_gap) {
  var stime = schedule_time.split(":")
  var time12 = (stime[0] % 12).toString() + ":" + stime[1] + (stime[0] < 12 ? "AM" : "PM")
  notifications_hash["type"] = "send_notification"
  notifications_hash["title"] = "Whats Boladão Plus"
  notifications_hash["message"] = "Sua campanha foi agendada para " + time12
  sendChromeMessage(notifications_hash)
  var ctime = new Date()
  var interval_time = ((Number(stime[0]) - ctime.getHours()) * 60 + (Number(stime[1]) - ctime.getMinutes()) + 1440) % 1440
  setTimeout(() => {
    messanger(numbers, message, time_gap, csv_data, customization, random_delay, batch_size, batch_gap)
  }, interval_time * 60000)
}

async function sendAttachment(number) {
  let name = null,
    t = document.querySelector("[aria-selected='true'] img") ? document.querySelector("[aria-selected='true'] img").getAttribute("src") : null
  document.querySelector("[aria-selected='true'] [title]")
    ? (name = document.querySelector("[aria-selected='true'] [title]").getAttribute("title").trim())
    : document.querySelector("header span[title]") &&
      (name = document
        .querySelector("header span[title]")
        .getAttribute("title")
        .replace(/[^A-Z0-9]/gi, "")
        .trim())
  let n = !1
  try {
    if ((n = await openNumber(my_number))) {
      let n = document.querySelectorAll("[data-testid='forward-chat']"),
        o = n[n.length - 1]
      await o.click()
      let l = document.querySelectorAll("[data-animate-modal-body='true'] div[class=''] > div div[tabindex='-1']")
      var attachment_sent = false
      for (let n = 0; n < l.length; n++) {
        if (l[n].querySelector("span[dir='auto']")) {
          let o = l[n].querySelector("span[dir='auto']"),
            s = l[n].querySelector("span[dir='auto']").title.trim()
          if (s === name || s.replace(/[^A-Z0-9]/gi, "").trim() === name) {
            let e = !t || !l[n].querySelector("img") || l[n].querySelector("img").src === t
            if (!e) continue
            attachment_sent = true
            await sendMedia(o), document.querySelector("[data-icon='send']").click()
            rows.push([number, "attachment sent"])
            break
          }
        }
      }
      if (!attachment_sent) rows.push([number, "attachment failed"])
    }
  } catch (e) {
    console.log(e, "ERROR")
    rows.push([number, "attachment failed"])
  }
}

async function sendMedia(e) {
  return new Promise((t) => {
    setTimeout(function () {
      e.click(), t()
    }, 500)
  })
}

async function openNumber(number) {
  openNumber(number, 1)
}

async function openNumber(number, time_gap) {
  if (!time_gap) time_gap = 3
  return new Promise((t) => {
    openNumberTab(number).then(() => {
      setTimeout(async function () {
        let e = !1
        ;(e = await hasOpened()), t(e)
      }, time_gap * 1000)
    })
  })
}

async function openNumberTab(number) {
  return new Promise((t) => {
    let n = document.getElementById("whatsapp-message-sender")
    n || (((n = document.createElement("a")).id = "whatsapp-message-sender"), document.body.append(n)),
      n.setAttribute("href", `https://api.whatsapp.com/send?phone=${number}`),
      setTimeout(() => {
        n.click(), t()
      }, 500)
  })
}

async function eventFire(e, t) {
  var n = document.createEvent("MouseEvents")
  return (
    n.initMouseEvent(t, !0, !0, window, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null),
    new Promise(function (t) {
      var o = setInterval(function () {
        document.querySelector('span[data-icon="send"]') && (e.dispatchEvent(n), t((clearInterval(o), "BUTTON CLICKED")))
      }, 500)
    })
  )
}

async function hasOpened() {
  let e = !0
  return await waitTillWindow(), document.querySelector('[data-animate-modal-popup="true"]') && (e = !1), e
}

async function waitTillWindow() {
  document.querySelector('[data-animate-modal-popup="true"]') &&
    !document.querySelector('[data-animate-modal-body="true"]').innerText.includes("invalid") &&
    setTimeout(async function () {
      await waitTillWindow()
    }, 500)
}

function sendMessage(number, message) {
  if (!message) return
  ;(messageBox = document.querySelectorAll("[contenteditable='true']")[1]), (event = document.createEvent("UIEvents"))
  messageBox.innerHTML = message.replace(/ /gm, " ")
  event.initUIEvent("input", !0, !0, window, 1), messageBox.dispatchEvent(event), eventFire(document.querySelector('span[data-icon="send"]'), "click")
}

function download_report() {
  let s = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n")
  var o = encodeURI(s),
    l = document.createElement("a")
  l.setAttribute("href", o), l.setAttribute("download", "report.csv"), document.body.appendChild(l), l.click()
}

async function download_group() {
  // var group = document.querySelector('div[title="Search…"]')
  //         .parentElement.parentElement.parentElement.parentElement.children[1].lastElementChild.textContent,
  //     group_name = document.querySelector('div[title="Search…"]')
  //         .parentElement.parentElement.parentElement.parentElement.children[1].firstElementChild.textContent;
  // if ("online" === e || "typing..." === e || "check here for contact info" === e || "" === e || e.includes("last seen"));
  // else {
  //     var n = [
  //         ["Numbers"]
  //     ];
  //     e.split(", ")
  //         .forEach(e => {
  //             if(e && e.includes("+"))
  //                 e = e.substring(1);
  //             arr = [], arr.push(e), n.push(arr)
  //         });
  //     let s = "data:text/csv;charset=utf-8," + n.map(e => e.join(","))
  //         .join("\n");
  //     var o = encodeURI(s),
  //         l = document.createElement("a");
  //     l.setAttribute("href", o), l.setAttribute("download", t + ".csv"), document.body.appendChild(l), l.click()
  // }

  // var group_sidebar = document.querySelector('._f0hJ');
  // var show_more = document.querySelector('[data-testid="down"]');
  // if (show_more)
  //     show_more.click();
  // var group_participants = group_sidebar.children[4];
  // group_participants.scrollTo(0, 0);
  // var total_height = group_sidebar.scrollHeight;
  // var contacts = [], position = 0;
  // var members = group_participants.children[3].children[0].children;
  // for (let i = 0; i < members.length; i++) {
  //     var contact_card = members[i];
  //     var number = members[0].children[0].children[0].children[1].children[0].children[0].innerText;
  //     var name = contact_card.children[0].children[0].children[1].children[1].children[1].innerText;
  //     if(number && number.includes("+"))
  //         number = number.substring(1);
  //     contacts.push([number, name]);
  //     console.log(contacts);
  // }
  // let s = "data:text/csv;charset=utf-8," + contacts.map(e => e.join(",")).join("\n");
  // var o = encodeURI(s),
  //     tempele = document.createElement("a");
  // tempele.setAttribute("href", o), tempele.setAttribute("download", group_name + ".csv"), document.body.appendChild(tempele), tempele.click()
  contacts = [["Phone", "Name", "Status"]]
  contact_hash = {}
  window.postMessage({ type: "get_contacts" }, "*")
  return
  header = document.getElementsByTagName("header")[0]
  group_sidebar = await new Promise((resolve) => {
    const interval = setInterval(() => {
      const async_side_bar = document.getElementsByTagName("section")[0].parentNode.parentElement
      if (async_side_bar) {
        resolve(async_side_bar)
        clearInterval(interval)
      }
    }, 100)
  })

  console.log(contact_hash)
  var show_more = document.querySelector('[data-testid="down"]')
  if (show_more) show_more.click()
  if (!group_sidebar) return
  observer = new MutationObserver(function (mutations, observer) {
    scrap_group()
  })

  observer.observe(group_sidebar, {
    childList: true,
    subtree: true,
  })

  TOTAL_MEMBERS = group_sidebar.parentElement.parentElement.querySelector("span").innerText.match(/\d+/)[0] * 1
  document.querySelector("span[data-icon=down]")?.click()

  header.nextSibling.scrollTop = 100

  if (AUTO_SCROLL) scrollInterval = setInterval(auto_scroll, SCROLL_INTERVAL)
}

var auto_scroll = function () {
  if (!scroll_end_reached(header.nextSibling)) header.nextSibling.scrollTop += SCROLL_INCREMENT
  else stop_scroll()
}

var scroll_end_reached = function (el) {
  if (el.scrollHeight - (el.clientHeight + el.scrollTop) == 0) return true
  return false
}
//document.getElementsByTagName("header")[0].parentElement.childNodes[1].childNodes[0].childNodes[5].childNodes[1].childNodes[1].click()
var stop_scroll = function () {
  window.clearInterval(scrollInterval)
  observer.disconnect()
  Object.keys(contact_hash).forEach(function (key) {
    contacts.push(contact_hash[key])
  })

  var group_name = document.getElementsByTagName("header")[0].parentElement.childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[1].innerText
  let s = "data:text/csv;charset=utf-8," + contacts.map((e) => e.join(",")).join("\n")
  alert(s)
  var o = encodeURI(s),
    tempele = document.createElement("a")
  tempele.setAttribute("href", o), tempele.setAttribute("download", group_name + ".csv"), document.body.appendChild(tempele), tempele.click()
}

var scrap_group = function () {
  var contact_list = group_sidebar.querySelectorAll(":scope > div")
  for (let i = 0; i < contact_list.length; i++) {
    var contact = contact_list[i]
    var phone,
      is_saved = true
    if (contact.querySelector("img") && contact.querySelector("img").src.match(/u=[0-9]*/)) {
      phone = contact
        .querySelector("img")
        .src.match(/u=[0-9]*/)[0]
        .substring(2)
        .replace(/[+\s]/g, "")
    } else {
      var temp = contact
        .querySelector("span[title]")
        .getAttribute("title")
        .match(/(.?)*[0-9]{3}$/)
      if (temp) {
        phone = temp[0].replace(/\D/g, "")
        is_saved = false
      } else {
        phone = ""
      }
    }
    var name = contact.firstChild.firstChild.childNodes[1].childNodes[1].childNodes[1].querySelector("span").innerText
    var status = contact.querySelectorAll("span[title]")[1] ? contact.querySelectorAll("span[title]")[1].title : ""
    if (phone != "") contact_hash[phone] = [phone, name, status]
  }
}

async function clickOnElements(e) {
  let t = document.createEvent("MouseEvents")
  t.initEvent("mouseover", !0, !0)
  const n = document.querySelector(e).dispatchEvent(t)
  t.initEvent("mousedown", !0, !0)
  const o = document.querySelector(e).dispatchEvent(t)
  t.initEvent("mouseup", !0, !0)
  const l = document.querySelector(e).dispatchEvent(t)
  t.initEvent("click", !0, !0)
  const s = document.querySelector(e).dispatchEvent(t)
  return n
    ? new Promise((e) => {
        e()
      })
    : await clickOnElements(e)
}
async function clickMediaIcon(e) {
  let t = null
  "pv" === e ? (t = '[data-icon="attach-image"]') : "doc" === e ? (t = '[data-icon="attach-document"]') : "cn" === e && (t = '[data-icon="attach-contact"]'),
    t && (await clickOnElements(t))
}

async function attachMedia(type) {
  if (!my_number) reload_mynumber()
  try {
    ;(hasOpenedSelf = await openNumber(my_number)), await clickOnElements('[data-testid="clip"] svg'), await clickMediaIcon(type)
  } catch (e) {
    console.log(type, "ERROR")
  }
  media_attached = true
  setTimeout(function () {
    notifications_hash["type"] = "send_notification"
    notifications_hash["title"] = "A primeira mensagem é sempre enviada para você"
    notifications_hash["message"] = "Agora abra a extensão e clique em 'Enviar mensagem'"
    sendChromeMessage(notifications_hash)
  }, 5000)
}

init()

function trackButtonClick(event) {
  sendChromeMessage({ type: "ga", event: event, track: "clicked" })
}

function trackEvent(event, track) {
  sendChromeMessage({ type: "ga", event: event, track: track })
}

function trackButtonView(event) {
  sendChromeMessage({ type: "ga", event: event, track: "viewed" })
}
