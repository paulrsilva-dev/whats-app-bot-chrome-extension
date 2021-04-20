(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga'); // Note: https protocol here

ga('create', 'UA-223075511-1', 'auto'); // Enter your GA identifier
ga('set', 'checkProtocolTask', function(){}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
ga('require', 'displayfeatures');
ga('send', 'pageview', 'chrome-extension:///klfaghfflijdgoljefdlofkoinndmpia/popup.html'); // Specify the virtual path

var csv_data = [];

$(function(){
    init();
});

function initvars() {
    chrome.storage.local.get(['popup_numbers', 'popup_message', 'popup_send_attachments', 'popup_attachment_type', 'time_gap', 'time_gap_checked', 'time_gap_type', 'batch_checked', 'batch_size', 'batch_gap', 'file_name', 'csv_data', 'customization', 'schedule_time'], function (result) {
        if(result.popup_numbers !== undefined){
            document.querySelector("textarea#numbers").value = result.popup_numbers;
        }
        if(result.popup_message !== undefined){
            document.querySelector("textarea#message").value = result.popup_message;
        }
        if(result.schedule_time !== undefined){
            console.log(result.schedule_time);
            document.querySelector("#schedule_time").value = result.schedule_time;
        }
        if(result.popup_send_attachments !== undefined){
            document.querySelector("#send_attachments").checked = result.popup_send_attachments;
            send_attachments_trigger();
            if(result.popup_send_attachments && (result.popup_attachment_type !== undefined))
                document.querySelector("#"+result.popup_attachment_type).checked = true;
        }
        if(result.time_gap_checked){
            document.querySelector("#time_gap_checked").checked = result.time_gap_checked;
            document.getElementById("time_gap_type").style.display = 'flex';
            if(result.time_gap_type)
                document.querySelector("#"+result.time_gap_type).checked = true;
        }
        if(result.time_gap)
            document.querySelector("#time_gap_sec").value = result.time_gap;
        if(result.batch_checked) {
            document.querySelector("#batch_checked").checked = result.batch_checked;
            document.getElementById("batch_info").style.display = 'grid';
        }
        if(result.batch_size)
            document.querySelector("#batch_size").value = result.batch_size;
        if(result.batch_gap)
            document.querySelector("#batch_gap").value = result.batch_gap;
        if((result.file_name !== undefined) || (result.file_name !== '')){
            file_data_style(result.file_name);
            csv_data = result.csv_data;
            if(csv_data){
                var column_headers = csv_data[0];
                $('#customized_arr').empty();
                $('#customized_arr').append($('<option disabled selected></option>').val('Select Option').html('Select Option'));
                $.each(column_headers, function(i, p) {
                    $('#customized_arr').append($('<option></option>').val(p).html(p));
                });
            }
        }
    });
}

function init() {
    checkVisit();
    initvars();
    getMessage();
}

function checkVisit(){
    chrome.storage.local.get(['no_of_visit', 'rate_us', 'survey_click'], function (result) {
        if(result.no_of_visit === undefined){
            chrome.storage.local.set({no_of_visit: 0 });
            window.open("https://web.whatsapp.com", "_blank");
        }
        else {
            chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
                var url = tabs[0].url;
                if (url !== "https://web.whatsapp.com" && url !== "https://web.whatsapp.com/")
                    window.open("https://web.whatsapp.com", "_blank");
                else{
                    chrome.storage.local.set({no_of_visit: result.no_of_visit + 1});
                    trackEvent('no_of_visit', result.no_of_visit);
                    console.log(result.no_of_visit);
                    if(result.no_of_visit > 100) {
                        document.getElementById("important_notice").style.display = 'block';
                        trackButtonView('important_notice');

                        // if(result.donation === undefined)
                        //     document.getElementById("donation").style.display = 'block';
                        // else
                        //     document.getElementById("donation2").style.display = 'block';
                    }
                }
            });
        }
        if(result.survey_click === undefined) {
            document.getElementById("survey").style.display = 'flex';
        }
    });
};

function sendMessageToBackground(message) {
    chrome.tabs.query({active: true, currentWindow: true},function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message);
    });
}

function show_error(error) {
    document.getElementById("error_message").style.display = 'block';
    document.getElementById("error_message").innerText = error;
}

function reset_error() {
    document.getElementById("error_message").innerText = '';
    document.getElementById("error_message").style.display = 'none';
}

function messagePreparation() {
    reset_error();
    var numbers_str = document.querySelector("textarea#numbers").value;
    var message = document.querySelector("textarea#message").value;
    var customization = $("#customization").is(":checked");
    var time_gap, random_delay, batch_size, batch_gap;
    if($("#time_gap_type input[type='radio']:checked").val() === 'sec') {
        time_gap = document.querySelector("#time_gap_sec").value;
        time_gap = parseInt(time_gap);
    }
    else{
        random_delay = true;
    }
    if(document.querySelector("#batch_checked").checked){
        batch_size = document.querySelector("#batch_size").value;
        batch_gap = document.querySelector("#batch_gap").value;
        if(batch_gap)
            batch_gap = parseInt(batch_gap);
    }

    var numbers = numbers_str.replace(/\n/g, ",").split(",");
    var attachment = document.querySelector("#send_attachments").checked;
    if(!numbers_str || (!message && !attachment)) {
        if(!numbers_str)
            show_error("Os n\u00fameros n\u00e3o podem ficar em branco");
        if(!message && !attachment)
            show_error("A mensagem n\u00e3o pode ficar em branco");
        return;
    }
    sendMessageToBackground({type: 'number_message',numbers: numbers, message: message, time_gap: time_gap, csv_data: csv_data, customization: customization, random_delay: random_delay, batch_size: batch_size, batch_gap: batch_gap});
    if(attachment) {
        document.querySelector("#send_attachments").checked = false;
        send_attachments_trigger();
    }
    window.close();
}

function processExcel(data) {
    var workbook = XLSX.read(data, {
        type: 'binary'
    });

    var firstSheet = workbook.SheetNames[0];
    var data = to_json(workbook);
    return data
};

function to_json(workbook) {
    var result = {};
    workbook.SheetNames.forEach(function(sheetName) {
        var roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
            header: 1
        });
        if (roa.length) result[sheetName] = roa;
    });
    return JSON.stringify(result, 2, 2);
};

function process_sheet_data(evt){
    var f = evt.target.files[0];

    if (f) {
        var r = new FileReader();
        r.onload = e => {
            var data = processExcel(e.target.result);
            data = JSON.parse(data);
            data = data[Object.keys(data)[0]];
            if (data && data.length > 0) {
                csv_data = data;
                var numbers = '';
                var column_headers = data[0];
                for (var i = 1; i < data.length; i++) {
                    if(data[i][0]) {
                        numbers += data[i][0];
                        if (i !== (data.length - 1))
                            numbers += ',';
                    }
                }
                document.getElementById("numbers").value = numbers;
                $('#customized_arr').empty();
                $('#customized_arr').append($('<option disabled selected></option>').val('Select Option').html('Select Option'));
                $.each(column_headers, function(i, p) {
                    $('#customized_arr').append($('<option></option>').val(p).html(p));
                });
                chrome.storage.local.set({csv_data: data });
                chrome.storage.local.set({popup_numbers: numbers });
                console.log('Imported -' + data.length + '- rows successfully!');
            } else {
                console.log('No data to import!');
            }
        };
        r.readAsBinaryString(f);
    } else {
        console.log("Failed to load file");
    }
}

function file_data_style(file_name){
    if(file_name) {
        var elem = document.getElementById('uploaded_csv');
        elem.innerText = file_name.substring(0, 32);
        elem.cursor = 'pointer';
        var button = document.createElement("button");
        button.innerHTML = 'x';
        Object.assign(button.style, {"border": "1px solid #C4C4C4","color": "#C4C4C4","padding": "0px 4px","margin-left": "4px","border-radius": "50%"});
        elem.appendChild(button);
        document.querySelector('textarea#numbers').disabled = true;
        document.getElementById("number_disable_message").style.display = 'block';
        document.querySelector("#customization").checked = true;
        chrome.storage.local.set({file_name: file_name });
    }
}

function getMessage() {

    $('#sender').click(function(){
        // if(document.getElementById("sheet").checked)
        //     process_sheet_data();
        // else
            messagePreparation();
        trackButtonClick('send_message');
    });
    $('#help').click(function(){
        sendMessageToBackground({type: 'help'});
        trackButtonClick('help');
    });
    $('#demo_video').click(function(){
        trackButtonClick('demo_video_top');
        window.open("https://www.waboladao.online/plus-como-usar", "_blank");
    });
    $('#demo_video_f').click(function(){
        trackButtonClick('demo_video_attachment');
        window.open("https://www.waboladao.online/plus-como-usar", "_blank");
    });
    $("#download_group").click(function () {
        sendMessageToBackground({ type: "download_group" })
        trackButtonClick("download_group")
        window.close()
    })
    $("#csv").on("change", function(e) {
        var file = document.getElementById("csv").files[0];
        if(file)
            file_data_style(file.name);
        process_sheet_data(e);
        trackButtonClick('csv_uploaded');
    });
    $("#send_attachments").on("change", function() {
        send_attachments_trigger();
    });
    $("#time_gap_checked").on("change", function() {
        var checked = $("#time_gap_checked").is(":checked");
        var style = checked ? "flex" : "none";
        document.getElementById("time_gap_type").style.display = style;
        chrome.storage.local.set({time_gap_checked: checked });
    });
    $("#batch_checked").on("change", function() {
        var checked = $("#batch_checked").is(":checked");
        var style = checked ? "grid" : "none";
        document.getElementById("batch_info").style.display = style;
        chrome.storage.local.set({batch_checked: checked });
    });
    $("#time_gap_sec").on("change", function() {
        var time_gap = document.querySelector("#time_gap_sec").value;
        chrome.storage.local.set({time_gap: time_gap });
    });
    $("#batch_size").on("change", function() {
        var batch_size = document.querySelector("#batch_size").value;
        chrome.storage.local.set({batch_size: batch_size });
    });
    $("#batch_gap").on("change", function() {
        var batch_gap = document.querySelector("#batch_gap").value;
        chrome.storage.local.set({batch_gap: batch_gap });
    });
    $("#time_gap_type input[type=radio]").on("change", function(e) {
        var value = e.target.value;
        console.log(value);
        chrome.storage.local.set({time_gap_type: value });
    });
    $("#numbers").on("change", function(e) {
        var numbers = document.querySelector("textarea#numbers").value;
        chrome.storage.local.set({popup_numbers: numbers });
        trackButtonClick('number_changed');
    });
    $('#attachment_info').click(function(){
        document.getElementById("attachment_popup").style.display = 'block';
    });
    $('#attachment_popup_okay').click(function(){
        document.getElementById("attachment_popup").style.display = 'none';
    });
    $("#attachment_type input").on("change", function(e) {
        var value = e.target.value;
        sendMessageToBackground({type: 'attachment', media_type: e.target.value});
        chrome.storage.local.set({popup_attachment_type: value });
        trackButtonClick('attachment_added');
    });
    $('#report').click(function(){
        sendMessageToBackground({type: 'download_report'});
        trackButtonClick('download_report');
    });
    $("#numbers").on("change", function(e) {
        var numbers = document.querySelector("textarea#numbers").value;
        chrome.storage.local.set({popup_numbers: numbers });
        trackButtonClick('number_changed');
    });
    $("#message").on("change", function(e) {
        var message = document.querySelector("textarea#message").value;
        chrome.storage.local.set({popup_message: message });
        trackButtonClick('message_changed');
    });
    $("#time_gap").on("change", function(e) {
        var time_gap = document.querySelector("#time_gap").value;
        trackButtonClick('time_gap_chnaged');
    });
    $("#customization").on("change", function(e) {
        var customization = document.querySelector("#customization").checked;
        chrome.storage.local.set({customization: customization });
        trackButtonClick('customization_added');
    });
    $("#customized_arr").on("change", function(e) {
        var val = document.querySelector("#customized_arr").value;
        var message = document.querySelector("textarea#message").value;
        message += " {{"+ val +"}}";
        document.querySelector("textarea#message").value = message;
        chrome.storage.local.set({popup_message: message });
    });
    $("#schedule_time").on("change", function(e) {
        var schedule_time = document.querySelector("#schedule_time").value;
        chrome.storage.local.set({schedule_time: schedule_time });
    });
    $('#uploaded_csv').click(function(){
        document.querySelector('#csv').value = '';
        document.querySelector('textarea#numbers').disabled = false;
        document.getElementById("number_disable_message").style.display = 'none';
        document.getElementById('uploaded_csv').innerHTML = '';
        chrome.storage.local.set({csv_data: [], file_name: ''});
        chrome.storage.local.get(['file_name'], function(result){console.log(result.file_name)});
    });
    $("#review_click").click(function(){
        document.getElementById("rate_us").style.display = 'none';
        chrome.storage.local.set({rate_us: true });
        trackButtonClick('review_click');
        window.open("", "_blank");
    });
    $("#survey_click").click(function(){
        document.getElementById("survey").style.display = 'none';
        chrome.storage.local.set({survey_click: true });
        trackButtonClick('survey_click');
        window.open("https://forms.gle/erzRTEz5y6i6d9SB9", "_blank");
    });
    $("#stop").click(function(){
        sendMessageToBackground({type: 'stop'});
        trackButtonClick('stop');
    });
    $("#schedule").click(function(){
        reset_error();
        var schedule_time = document.querySelector("#schedule_time").value;
        var numbers_str = document.querySelector("textarea#numbers").value;
        var message = document.querySelector("textarea#message").value;
        var customization = $("#customization").is(":checked");
        var time_gap, random_delay, batch_size, batch_gap;
        if($("#time_gap_type input[type='radio']:checked").val() === 'sec') {
            time_gap = document.querySelector("#time_gap_sec").value;
            time_gap = parseInt(time_gap);
        }
        else{
            random_delay = true;
        }
        if(document.querySelector("#batch_checked").checked){
            batch_size = document.querySelector("#batch_size").value;
            batch_gap = document.querySelector("#batch_gap").value;
        }
        var numbers = numbers_str.replace(/\n/g, ",").split(",");
        if(!numbers_str || !message) {
            if(!numbers_str)
                show_error("Os n\u00fameros n\u00e3o podem ficar em branco");
            if(!message)
                show_error("A mensagem n\u00e3o pode ficar em branco");
            return;
        }
        if(!schedule_time){
            show_error("O hor\u00e1rio da programa\u00e7\u00e3o n\u00e3o pode ficar em branco");
            return;
        }

        sendMessageToBackground({type: 'schedule_message',numbers: numbers, message: message, time_gap: time_gap, csv_data: csv_data, customization: customization, schedule_time: schedule_time, random_delay: random_delay, batch_size: batch_size, batch_gap: batch_gap});
        trackButtonClick('schedule');
        window.close();
    });
}

function download_group(){
    sendMessageToBackground({type: 'download_group'});
}

function send_attachments_trigger(){
    var checked = $("#send_attachments").is(":checked");
    var style = checked ? "flex" : "none";
    document.getElementById("attachment_type").style.display = style;
    chrome.storage.local.get(['popup_attachment_type', 'popup_send_attachments'], function (result) {
        if (!checked && result.popup_attachment_type !== undefined) {
            document.querySelector("#"+result.popup_attachment_type).checked = false;
        }
        if(result.popup_send_attachments === undefined){
            document.getElementById("attachment_popup").style.display = style;
            if(checked)
                trackButtonView('attachment_popup');
        }
    });
    chrome.storage.local.set({popup_send_attachments: checked });

}

function trackButtonClick(event) {
    ga('send', 'event', event, 'clicked');
}

function trackButtonView(event) {
    ga('send', 'event', event, 'viewed');
}

function trackEvent(event, track){
    ga('send', 'event', event, track);
}