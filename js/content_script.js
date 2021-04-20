/*
    Written by Shan Eapen Koshy
    Date: 14 March 2020
*/
const FROM_CONTENT_SCRIPT = "FROM_CONTENT_SCRIPT";

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        //get Current Group Name
        try {
            var groupName = document.querySelectorAll("#main > header > div:nth-child(2) span")[0].title;
        } catch (error) {
            var groupName = '';
            // TODO: Log error to sentry with the license code
        }

        if (request.contentScriptQuery == 'currentGroup') {
            sendResponse(groupName)
        } else if (request.contentScriptQuery == 'stopAutoScroll') {
            WAXP.stop();
        } else {

            chrome.storage.local.get("licenseStatus", function (res) {
                if (res.licenseStatus.key || res.licenseStatus.TRIAL_USAGE_COUNT < 999999999999) {
                    var config = JSON.parse(request.contentScriptQuery);
                    WAXP.options.SCROLL_INCREMENT = config.SCROLL_INCREMENT ? config.SCROLL_INCREMENT * 1 : WAXP.options.SCROLL_INCREMENT;
                    WAXP.options.SCROLL_INTERVAL = config.SCROLL_INTERVAL ? config.SCROLL_INTERVAL * 1 : WAXP.options.SCROLL_INTERVAL;
                    WAXP.options.NAME_PREFIX = config.NAME_PREFIX;
                    switch (config.EXPORT_TYPE) {
                        case "scrape-export-group-unsaved":
                            WAXP.options.UNKNOWN_CONTACTS_ONLY = true;
                            WAXP.start();
                            break;
                        case "scrape-export-group-all":
                            WAXP.options.UNKNOWN_CONTACTS_ONLY = false;
                            WAXP.start();
                            break;
                        case "instant-export-group-numbers":
                            WAXP.options.UNKNOWN_CONTACTS_ONLY = true;
                            WAXP.quickExport();
                            break;
                        case "instant-export-chatlist-all":
                        case "instant-export-chatlist-unsaved":
                        case "instant-export-label-all":
                        case "instant-export-label-unsaved":
                        case "instant-export-group-unsaved":
                        case "instant-export-group-all":
                        case "instant-export-all-groups":

                            var TRIAL = true;
                            if (res.licenseStatus.key)
                                TRIAL = false;

                            var data = {
                                isUsingTrial: TRIAL,
                                TRIAL_USAGE_COUNT: res.licenseStatus.TRIAL_USAGE_COUNT,
                                type: FROM_CONTENT_SCRIPT,
                                text: config.EXPORT_TYPE,
                                groupName: groupName,
                                namePrefix: config.NAME_PREFIX
                            };
                            window.postMessage(data, "*");

                    }
                } else {
                    // alert("Your free trial is over. Please activate license!");
                    // showModal();
                }
            });

        }
    }
);


/**
 * Show the donation box/ trial end modal
 */
function showModal() {
    var modal = document.getElementById("donationBoxModel");
    modal.style.display = modal.parentElement.style.display = "block";
}

window.addEventListener("message", function (event) {
    // We only accept messages from ourselves
    if (event.source != window)
        return;
    if (event.data.incrementTrial) {
        incrementTrialUsageCount();
    } else if (event.data.message == "download") {
        console.log("WAXP:content_script: Starting excel export.")
        RunExcelJSExport(event.data.data);
    }
});

function incrementTrialUsageCount() {

    chrome.storage.local.get("licenseStatus", function (res) {
        var l = {
            key: res.licenseStatus.key,
            TRIAL_USAGE_COUNT: res.licenseStatus.TRIAL_USAGE_COUNT + 1
        }
        chrome.storage.local.set({
            "licenseStatus": l
        });
    })
}

function injectJS(url) {
    let s = document.createElement("script");
    s.type = "text/javascript";
    s.src = url;
    (document.head || document.body || document.documentElement).appendChild(s);

    //Injecting loading icon and DonationBox Pop Up
    var html = `<div id="loadingAnimation" style="display:none">
                <div class="loading-spinner" style="display: grid;background: #121c23;grid-template-columns: 1fr 1fr;place-items: center;padding: 10px 40px;border-radius: 5px;">
                    <video src='${chrome.extension.getURL('/video/green-spinner.mp4')}' autoplay muted loop height='50px'></video>
                    <p id="waxp_spinner_text" style="font-size: 23px;">loading</p>
                </div></div><style>.loading-spinner {z-index:9999;position: fixed;top:50%;left: 50%;transform: translate(-50%,-50%);display:none;}</style>
                
        <div id="donationBoxModel" class="modal" style='display:none;'><div class="modal-content"><div class="modal-header"><span id="closeButton" class="close">&times;</span><h2>Download Complete 🥳</h2></div><div class="modal-body"><div id="qrCodeContainer" class=hidden><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 43 43" class="qr-code"><path d="M1 1h7v7h-7zM9 1h3v2h1v1h-2v2h-2v-1h1v-1h-1zM13 1h1v1h-1zM15 1h4v1h-2v1h-1v1h-1v-1h-1v-1h1zM20 1h1v3h-1v-1h-1v-1h1zM23 1h1v2h1v1h1v1h-2v-1h-1v-1h-1v-1h1zM25 1h3v2h1v1h-1v1h-1v-1h-1v-2h-1zM29 1h1v1h1v1h1v-1h2v3h-1v-1h-3v-1h-1zM31 1h1v1h-1zM35 1h7v7h-7zM2 2v5h5v-5zM36 2v5h5v-5zM3 3h3v3h-3zM17 3h1v2h-1v1h1v3h1v1h-2v-3h-1v1h-1v-3h1v-1h1zM37 3h3v3h-3zM14 4h1v1h-1zM19 4h1v1h-1zM29 4h1v2h-1zM12 5h1v1h-1zM20 5h3v1h-1v2h-1v-2h-1zM26 5h1v1h-1zM31 5h2v1h-1v2h-1v-1h-1v-1h1zM11 6h1v2h1v-1h1v3h1v-1h1v2h2v1h-1v1h-1v-1h-1v-1h-3v1h-1v-2h1v-1h-1v1h-2v1h-1v-1h-1v1h1v1h-2v-1h-1v6h-1v-1h-3v-2h1v1h1v-1h1v-2h-1v-1h-1v1h1v2h-1v-1h-1v-4h1v1h2v-1h6v-1h1zM23 6h2v1h-1v3h-1zM9 7h1v1h-1zM19 7h1v1h1v3h-1v2h2v1h-1v1h-1v-1h-1v-1h-1v-1h1v-2h1v-1h-1zM25 7h1v1h-1zM27 7h1v1h-1zM29 7h1v1h-1zM33 7h1v2h1v2h-1v-1h-1v1h-1v-1h-1v1h-1v-1h-2v1h-1v1h-1v1h-1v1h-1v-4h1v1h1v-1h-1v-1h1v-1h1v1h5v-1h1zM37 9h1v1h1v-1h3v1h-2v2h-1v1h-2v-1h1v-1h-1v1h-1v-2h1zM22 11h1v1h-1zM28 11h2v1h-2zM9 12h1v1h-1zM30 12h2v1h1v1h1v-2h2v1h1v1h1v2h-2v-1h-2v1h1v2h-1v1h-1v-3h-1v-2h-1v-1h-1zM40 12h2v4h-1v-1h-2v-1h1zM7 13h1v1h-1zM10 13h2v1h1v2h1v3h1v-2h1v1h1v-1h-1v-1h2v1h1v1h-1v1h-1v1h-1v1h-3v-2h-1v-1h1v-1h-1v1h-1v-1h-1v-1h-1v1h-1v-1h-2v-2h1v1h1v-1h1v1h1zM14 13h2v3h-2zM27 13h1v3h-2v-1h-1v-1h2zM29 13h1v1h1v2h-2zM18 14h1v1h-1zM23 14h1v1h-1zM11 15v1h1v-1zM19 15h1v1h1v1h1v2h-1v-1h-1v-1h-1zM22 15h1v1h-1zM25 16h1v1h2v1h1v1h1v-1h2v1h1v2h-1v-1h-2v2h-1v2h-1v-1h-1v1h-1v1h-1v2h-1v1h1v1h6v1h-1v1h-1v-1h-1v1h1v1h-1v1h-2v-1h1v-2h-2v1h-1v1h-1v-4h-1v-1h1v-1h1v-2h-2v2h-1v-1h-1v-1h1v-1h-2v-1h1v-1h1v1h1v-1h1v-1h-1v-1h4v1h-2v2h-1v1h3v-1h-1v-1h2v-1h1v1h1v-1h-1v-1h-2v-1h-2v-1h1zM28 16h1v1h-1zM38 16h3v1h-3zM1 17h2v1h-1v1h-1zM7 17h1v1h-1zM36 17h1v1h1v1h-1v1h-1v1h1v1h-2v-2h-1v-1h2zM41 17h1v1h-1zM4 18h1v1h-1zM10 18h1v1h-1zM2 19h2v1h1v-1h4v1h-3v1h-1v1h-1v1h1v4h-2v1h2v-1h1v-3h1v1h2v1h-2v1h1v1h-1v1h1v-1h1v2h-2v1h-1v1h-1v-3h-2v1h-1v1h1v-1h1v3h-1v1h-2v-8h1v-1h1v1h1v-2h-1v-2h-1v3h-1v-5h1zM11 19h1v2h1v1h2v2h-2v1h2v2h-1v-1h-1v1h-2v-1h1v-3h-2v-1h-1v-2h1v1h1zM20 19h1v1h-1zM41 19h1v1h-1zM18 20h2v1h-2zM39 20h1v1h2v1h-1v1h-1v-1h-1v1h1v1h-2v-1h-1v-1h1v-1h1zM7 21h1v1h-1zM17 21h1v2h-1zM31 21h1v1h-1zM33 21h1v1h-1zM5 22h1v1h-1zM8 22h1v1h1v1h-3v-1h1zM30 22h1v1h-1zM32 22h1v1h-1zM18 23h1v2h-1zM33 23h1v3h-2v-2h1zM36 23h1v1h1v1h-1v1h-1v1h1v-1h3v1h-1v1h1v1h-2v-1h-2v1h-1v-1h-1v-1h1v-3h1zM15 24h2v1h-2zM29 24h2v1h-2zM17 25h1v2h-1zM26 25h1v2h1v-1h1v2h-4v-1h1zM41 25h1v3h-1zM19 26h1v1h1v1h-1v1h-1zM30 26h2v1h-2zM13 27h1v1h1v3h-1v-2h-2v-1h1zM15 27h2v1h-2zM32 27h1v1h-1zM17 28h1v1h1v1h1v1h1v1h1v2h-2v2h-1v1h3v-1h1v-1h1v-1h-1v-1h1v-1h1v3h1v2h-1v1h1v-1h1v-2h1v-2h1v2h1v2h1v1h-1v1h-1v1h1v2h-7v-1h1v-1h1v-1h-1v-2h-1v1h-4v2h-1v-3h-2v-2h3v-1h-2v-2h1v1h1v-1h-1v-2h-2v-1h1zM21 28h1v1h-1zM33 28h1v1h1v1h-1v2h-1zM10 29h1v2h-1zM20 29h1v1h-1zM35 30h1v1h-1zM37 30h3v1h-1v1h-1v1h1v1h-1v2h1v1h-1v1h-1v1h-1v-1h-1v1h-1v-1h-1v1h-1v1h-2v-1h1v-1h1v-1h1v-1h-1v-1h-2v-2h1v1h2v-1h1v-1h2v1h1v-1h-1v-1h1zM7 31h3v1h-1v1h-1v-1h-1zM16 31h1v1h-1zM25 31h1v1h-1zM41 31h1v2h-1v2h-1v-2h-1v-1h2zM6 32h1v1h-1zM10 32h1v1h-1zM15 32h1v3h-2v-1h1zM31 32h1v1h-1zM4 33h1v1h-1zM7 33h1v1h-1zM11 33h1v1h-1zM9 34h2v2h1v2h-2v1h-1zM12 34h1v1h-1zM22 34h1v1h-1zM34 34v3h3v-3zM1 35h7v7h-7zM21 35h1v1h-1zM35 35h1v1h-1zM39 35h1v1h-1zM2 36v5h5v-5zM14 36h1v1h-1zM28 36v1h1v-1zM31 36h1v1h-1zM40 36h2v2h-1v1h-1zM3 37h3v3h-3zM13 37h1v1h-1zM15 37h1v1h1v2h-2v1h-1v1h-1v-1h-1v-1h1v-1h1v-1h1zM27 38v1h-1v2h1v-1h1v-2zM11 39h1v1h-1zM20 39h2v1h-2zM23 39h1v1h-1zM33 39h1v1h-1zM37 39h1v2h-1v1h-1v-2h1zM41 39h1v2h-1zM19 40h1v1h-1zM34 40h1v2h-2v-1h1zM39 40h1v1h-1zM9 41h1v1h-1zM11 41h1v1h-1zM15 41h2v1h-2zM21 41h1v1h-1zM38 41h1v1h-1z" /></svg><p>UPI Adddress:shaneapen@ybl</p></div><img class="profile" src="https://i.stack.imgur.com/FLrhl.jpg?s=128"><p style="font-size:13px;font-weight:bold;text-align:center;margin:15px 10px;">Hi 👋🏼, I'm Shan, the developer behind WAXP. I have a request to make; if the plugin worked great for you please donate to help me keep this mode for free and maintained.</p><div class="donate-buttons"><a href="https://www.buymeacoffee.com/shaneapenkoshy" target="_blank" class="bmc" style="background:#FD8148;color:white;text-decoration:none;font-weight:bold;">Buy Me a Coffee</a><a href="https://www.paypal.com/paypalme/shaneapen" target="_blank" class="paypal" style="background:#eaeaea;"><img src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/PP_logo_h_100x26.png" height="22px"></a><a role="button" class="UPI" style="background:white;color:black;" onclick="showQR(true);"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" height="26px">Show QR Code </a></div></div><div class="modal-footer"></div></div></div><style>.modal{ position:fixed; bottom:10px; right:10px; margin:0px; max-width:350px; z-index:9999; min-height:450px; background:#094182; border-radius:5px; color:#ececec; animation:0.3s animatebottom cubic-bezier(1, 0.1, 0.67, 1.01); font-family:Arial, Helvetica, sans-serif;} .modal h2{ text-align:center; margin:0; font-size:x-large;} .modal p{ text-align:center;} .modal-content{ padding:10px;} @-webkit-keyframes animatebottom{ from{ bottom:-300px; right:-200px; opacity:0;} to{ bottom:10px; opacity:1;}} @keyframes animatebottom{ from{ bottom:-300px; right:-200px; opacity:0;} to{ bottom:10px; opacity:1;}} .modal .close{ color:white; font-size:28px; font-weight:bold; display:inline; top:10px; right:10px; position:absolute;} .modal .close:hover, .modal .close:focus{ color:#000; text-decoration:none; cursor:pointer;} .modal-header{ padding:10px; color:white;} .modal-body{ padding:2px 16px;} .modal-footer{ text-align:center; font-size:14px;} .donate-buttons a{ display:block; text-align:center; padding:10px; margin:5px 0; border-radius:5px; font-size:14px; cursor:pointer;} .donate-buttons a:hover{ opacity:0.88;} .donate-buttons a >img{ vertical-align:middle;} .modal .profile{ border-radius:100%; margin:0 auto; text-align:center; display:block; height:100px;} .modal .qr-code{ width:100px; fill:black; background:white; margin:0 auto; display:block;} .hidden{ display:none!important;} </style>`;

    let d = document.createElement("div"),
        u = document.createElement("script");

    d.innerHTML = html;

    u.type = "text/javascript";
    u.text = `var greenSpinner=document.getElementById("loadingAnimation");function showLoading(){greenSpinner.style.display="block"}function hideLoading(){greenSpinner.style.display="none"}

    var closeButton=document.getElementById("closeButton"),modal=document.getElementById("donationBoxModel");function showModal(){modal.style.display=modal.parentElement.style.display="block"}function showQR(e){e?(document.getElementById("qrCodeContainer").classList.remove("hidden"),document.getElementsByClassName("profile")[0].classList.add("hidden")):(document.getElementById("qrCodeContainer").classList.add("hidden"),document.getElementsByClassName("profile")[0].classList.remove("hidden"))}closeButton.addEventListener("click",function(){modal.parentElement.style.display=modal.style.display="none",showQR(!1)});`;
    d.appendChild(u);
    (document.body || document.documentElement).appendChild(d);
}

/**
 * Loads the store.js script to the DOM after WA Web has completely loaded.
 */
function addStore() {
    var timer = setInterval(function () {
        if (Boolean(document.getElementById('pane-side'))) {
            // if chatlist has loaded
            injectJS(chrome.extension.getURL("/js/client.js"));
            injectJS(chrome.extension.getURL("/js/libphonenumber-max.js"));
            clearInterval(timer);
        }
    }, 1000);
}

WAXP = (function () {

    addStore();

    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    var SCROLL_INTERVAL = 600,
        SCROLL_INCREMENT = 450,
        AUTO_SCROLL = true,
        NAME_PREFIX = '',
        UNKNOWN_CONTACTS_ONLY = false,
        MEMBERS_QUEUE = {},
        TOTAL_MEMBERS;

    var CONTACTS_WITHOUT_PHONE_NUMBER;

    var scrollInterval, observer, membersList, header;

    console.log("%c WAXP by Codegena ", "font-size:24px;font-weight:bold;color:white;background:green;");

    var getMembersListCard = function () {
        // Returns the container card holding the group members list
        return document.querySelectorAll('span[title=You]')[0]
            ?.parentNode
            ?.parentNode
            ?.parentNode
            ?.parentNode
            ?.parentNode
            ?.parentNode
            ?.parentNode
            ?.parentNode;
    }

    var start = function () {

        CONTACTS_WITHOUT_PHONE_NUMBER = new Set();
        membersList = getMembersListCard();
        header = document.getElementsByTagName('header')[0];

        if (!membersList) {
            document.querySelector("#main > header").firstChild.click();
            membersList = getMembersListCard();
            header = document.getElementsByTagName('header')[0];
        }

        observer = new MutationObserver(function (mutations, observer) {
            scrapeData(); // fired when a mutation occurs
        });

        // the div to watch for mutations
        observer.observe(membersList, {
            childList: true,
            subtree: true
        });

        TOTAL_MEMBERS = membersList.parentElement.parentElement.parentElement.querySelector('span').innerText.match(/\d+/)[0] * 1;

        // click the `n more` button to show all members
        document.querySelector("span[data-icon=down]")?.click()

        //scroll to top before beginning
        header.nextSibling.scrollTop = 100;
        scrapeData();

        if (AUTO_SCROLL) scrollInterval = setInterval(autoScroll, SCROLL_INTERVAL);
    }


    /**
     *  Function to autoscroll the div
     */

    var autoScroll = function () {
        if (!utils.scrollEndReached(header.nextSibling))
            header.nextSibling.scrollTop += SCROLL_INCREMENT;
        else
            stop();
    };

    /**
     *  Stops the current scrape instance and prepares data for download
     */

    var stop = function () {

        window.clearInterval(scrollInterval);
        observer.disconnect();
        console.log(`%c Extracted [${utils.queueLength()} / ${TOTAL_MEMBERS}] Members. Starting Download..`, `font-size:13px;color:white;background:green;border-radius:10px;`)

        //Preparing data for download
        if (utils.queueLength() > 0) {

            var data = "Name, Phone, Status\n";

            for (key in MEMBERS_QUEUE) {
                // Wrapping each variable around double quotes to prevent commas in the string from adding new cols in CSV
                // replacing any double quotes within the text to single quotes
                data += `"${MEMBERS_QUEUE[key]['Name']}","${key}","${MEMBERS_QUEUE[key]['Status'].replace(/\"/g, "'")}"\n`;
            }

            // Saved contacts that doesn't have a profile picture will not contain their phone number details
            if (CONTACTS_WITHOUT_PHONE_NUMBER.size > 0) {
                data += `\n CONTACTS WITHOUT PHONE NUMBER`;
                CONTACTS_WITHOUT_PHONE_NUMBER.forEach(function (el) {
                    data += `\n"${el}"`;
                })
            }

            downloadAsCSV(data);
            // showModal();
            // alert("Download Complete!\n If you don't see any downloads, make sure that automatic downloads are allowed on this page.");

        } else {
            alert("Couldn't find any unsaved contacts in this group!");
        }


    }

    /**
     *  Function to scrape member data
     */
    var scrapeData = function () {
        var contact, status, name;
        var memberCard = membersList.querySelectorAll(':scope > div');

        for (let i = 0; i < memberCard.length; i++) {

            status = memberCard[i].querySelectorAll('span[title]')[1] ? memberCard[i].querySelectorAll('span[title]')[1].title : "";
            contact = scrapePhoneNum(memberCard[i]);
            name = scrapeName(memberCard[i]);

            if (contact.phone != 'NIL' && !MEMBERS_QUEUE[contact.phone]) {

                if (contact.isUnsaved) {
                    MEMBERS_QUEUE[contact.phone] = {
                        'Name': NAME_PREFIX + name,
                        'Status': status
                    };
                    continue;
                } else if (!UNKNOWN_CONTACTS_ONLY) {
                    MEMBERS_QUEUE[contact.phone] = {
                        'Name': name,
                        'Status': status
                    };
                }
                CONTACTS_WITHOUT_PHONE_NUMBER.delete(name);

            } else if (contact.phone == 'NIL' && !contact.isUnsaved) {
                CONTACTS_WITHOUT_PHONE_NUMBER.add(name);
            } else if (MEMBERS_QUEUE[contact.phone]) {
                MEMBERS_QUEUE[contact.phone].Status = status;
            }

            if (utils.queueLength() >= TOTAL_MEMBERS) {
                stop();
                break;
            }

            //console.log(`%c Extracted [${utils.queueLength()} / ${TOTAL_MEMBERS}] Members `,`font-size:13px;color:white;background:green;border-radius:10px;`)
        }
    }

    /**
     * Scrapes phone no from html node
     * @param {object} el - HTML node
     * @returns {string} - phone number without special chars
     */

    var scrapePhoneNum = function (el) {
        var phone, isUnsaved = false;
        if (el.querySelector('img') && el.querySelector('img').src.match(/u=[0-9]*/)) {
            phone = el.querySelector('img').src.match(/u=[0-9]*/)[0].substring(2).replace(/[+\s]/g, '');
        } else {
            var temp = el.querySelector('span[title]').getAttribute('title').match(/(.?)*[0-9]{3}$/);
            if (temp) {
                phone = temp[0].replace(/\D/g, '');
                isUnsaved = true;
            } else {
                phone = 'NIL';
            }
        }
        return {
            'phone': phone,
            'isUnsaved': isUnsaved
        };
    }

    /**
     *  Scrapes name from HTML node
     * @param {object} el - HTML node
     * @returns {string} - returns name..if no name is present phone number is returned
     */

    var scrapeName = function (el) {
        expectedName = el.firstChild.childNodes[0].childNodes[1].firstChild.querySelector('span').innerText
        if (expectedName == "") {
            return el.querySelector('span[title]').getAttribute('title'); //phone number
        }
        return expectedName;
    }


    /**
     * A utility function to download the result as CSV file
     * @References
     * [1] - https://stackoverflow.com/questions/4617935/is-there-a-way-to-include-commas-in-csv-columns-without-breaking-the-formatting
     * 
     */
    var downloadAsCSV = function (data) {

        var groupName = document.querySelectorAll("#main > header span")[1].title;
        var fileName = groupName.replace(/[^\d\w\s]/g, '') ? groupName.replace(/[^\d\w\s]/g, '') : 'WAXP-group-members';

        var a = document.createElement('a');
        a.style.display = "none";

        var url = window.URL.createObjectURL(new Blob([data], {
            type: "data:attachment/text"
        }));
        a.setAttribute("href", url);
        a.setAttribute("download", `${fileName}.csv`);
        document.body.append(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        //increment TRIAL
        incrementTrialUsageCount();
    }

    /**
     *  Scrape contacts instantly from the group header.
     *  Saved Contacts cannot be exchanged for numbers with this method.
     */

    var quickExport = function () {

        var members = document.querySelectorAll("#main > header span")[2].title.replace(/ /g, '').split(',');
        var data = "Phone\n";

        members.pop(); //removing 'YOU' from array

        MEMBERS_QUEUE = {};

        if (members[members.length - 1].match(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)) {
            //If the last member is a phone number, then we have something to export otherwise all members are already saved
            for (i = 0; i < members.length; ++i)
                if (members[i].match(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/))
                    data += `${members[i]}\n`;

            downloadAsCSV(data);
        } else {
            alert("No unknown phone numbers are present.");
        }
    }

    /**
     *  Helper functions
     *  @References [1] https://stackoverflow.com/questions/53158796/get-scroll-position-with-reactjs/53158893#53158893
     */

    var utils = (function () {

        return {
            scrollEndReached: function (el) {
                if ((el.scrollHeight - (el.clientHeight + el.scrollTop)) == 0)
                    return true;
                return false;
            },
            queueLength: function () {
                var size = 0,
                    key;
                for (key in MEMBERS_QUEUE) {
                    if (MEMBERS_QUEUE.hasOwnProperty(key)) size++;
                }
                return size;
            }
        }
    })();


    // Defines the WAXP interface following module pattern
    return {
        start: function () {
            MEMBERS_QUEUE = {}; //reset
            try {
                start();
            } catch (error) {
                //TO overcome below error..but not sure of any sideeffects
                //TypeError: Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'.
                console.log(error, '\nRETRYING in 1 second')
                setTimeout(start, 1000);
            }
        },
        stop: function () {
            stop()
        },
        options: {
            // works for now...but consider refactoring it provided better approach exist
            set NAME_PREFIX(val) {
                NAME_PREFIX = val
            },
            set SCROLL_INTERVAL(val) {
                SCROLL_INTERVAL = val
            },
            set SCROLL_INCREMENT(val) {
                SCROLL_INCREMENT = val
            },
            set AUTO_SCROLL(val) {
                AUTO_SCROLL = val
            },
            set UNKNOWN_CONTACTS_ONLY(val) {
                UNKNOWN_CONTACTS_ONLY = val
            },
            // getter
            get NAME_PREFIX() {
                return NAME_PREFIX
            },
            get SCROLL_INTERVAL() {
                return SCROLL_INTERVAL
            },
            get SCROLL_INCREMENT() {
                return SCROLL_INCREMENT
            },
            get AUTO_SCROLL() {
                return AUTO_SCROLL
            },
            get UNKNOWN_CONTACTS_ONLY() {
                return UNKNOWN_CONTACTS_ONLY
            },
        },
        quickExport: function () {
            quickExport();
        },
        debug: function () {
            return {
                size: utils.queueLength(),
                q: MEMBERS_QUEUE
            }
        }
    }
})();

/**
 * Function to export to Excel format
 * @param {String} fileName 
 * @param {Object} data  
 * 
 * Example Data format:
 *   payload = {
        headers: ["Name", "Phone", "Country"],
        type: "groups", // or "chatlist", "labels"
        filter: "unsaved", // or "all"
        groups: {
            groupName1: [
                ["Shan", "9656382333", "India"],
                ["Saira", "9656382333", "India"]
            ],
            groupName2: [
                ["Shan", "9656382333", "India"],
            ]
        }
    }
 */
function RunExcelJSExport(data) {
    console.log(data)

    let fileName = data.fileName;
    if (!fileName) fileName = "WAXP Export.xlsx";
    if (!fileName.endsWith(".xlsx")) fileName += ".xlsx";

    let wb = new ExcelJS.Workbook();

    const COL_WIDTHS = {
        name: 20,
        phone: 20,
    }

    for (const [key, contacts] of Object.entries(data[data.type])) {
        let worksheetName = key;
        let ws = wb.addWorksheet(worksheetName,
            {
                properties: {
                    tabColor: { argb: 'FFFF0000' } // Create a random color
                },
            }
        );
        ws.headerFooter.firstHeader = "Page &P of &N";

        // Preparing the headers in the format that ExcelJS expects
        const headers = data.headers.map(header => {
            let colHeader = {
                key: getKey(header),
                header: header,
            }
            // Set the column's width if a width is specified in the mapping variable
            if (COL_WIDTHS[colHeader.key]) colHeader["width"] = COL_WIDTHS[colHeader.key];
            return colHeader;
        });

        // Adding the columns..A new copy of the object has to be supplied
        ws.columns = headers.slice();

        // Add contacts to sheet
        ws.addRows(contacts);
        // const headerKeys = headers.map(h => h.key);
        // const contactsObj = contacts.map(contact => {
        //     let obj = {};
        //     for (const [i, value] of contact.entries()) {
        //         obj[headerKeys[i]] = value;
        //     }
        //     return obj;
        // })
        // ws.addRows(contactsObj);

        // ##################################  FORMATTINGS  ################################## 

        // Bold the header
        ws.getRow(1).font = { bold: true };
        ws.views = [{ state: "frozen", ySplit: 1 }];

    }

    // Saving file
    wb.xlsx.writeBuffer()
        .then(function (buffer) {
            saveAs(
                new Blob([buffer], { type: "application/octet-stream" }),
                fileName
            );
            // Signal download complete
            window.postMessage({
                type: FROM_CONTENT_SCRIPT,
                text: "download-complete"
            }, "*");
        });
}

function getKey(name) {
    return name.toLowerCase();
}
