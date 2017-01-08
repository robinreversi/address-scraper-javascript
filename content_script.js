var rawData = [];
var flagged = [];
var urlsScanned = 0;

/* * *
 @Pre-condition: url is the url of the webpage to be searched
 @Post-condition: rawData is filled with the needed information from the ONE url
* * */
function scanPage(url, callback) {
  var request = new XMLHttpRequest();
  request.responseType = 'document';
  request.onreadystatechange = function() {
     if(request.readyState == 4 && request.status == 200) {
       callback(request.responseXML);
     }
  }
  request.open('GET', url, true);
  request.send(null);
}

/* * *
  @Pre-condition: propertyPage is not null
  @Post-condition: the information from propertyPage has been correctly added to rawData
* * */
function storeMailDetails(propertyPage) {
  var mailDetails = propertyPage.evaluate('//div[@id="propertyDetails"]//tr[8]/td[2] | //div[@id="propertyDetails"]//tr[13]/td[2] | //*[@id="deedHistoryDetails_deedHistoryTable"]/tbody/tr[2]/td[2] | //*[@id="propertyDetails"]/table/tbody/tr[12]/td[2]', propertyPage, null, 6, null);
  rawData.push(formatMailDetails(mailDetails));
  urlsScanned++;
}

/* * *
  @Pre-condition: apprDetails != null
  @Post-condition: formatApprDetails returns a properly formatted String containing the info
  **** CHANGE INTO OBJECT ****
* * */
function formatMailDetails(mailDetails) {
  var frmtInfo = {
    owner: checkName(mailDetails.snapshotItem(3)),
    property_address: mailDetails.snapshotItem(0).textContent,
    mailing_address: mailDetails.snapshotItem(1).textContent,
    deed_date: checkDeedDate(mailDetails.snapshotItem(2)),
  }
  return frmtInfo;
}

function checkName(name) {
  if(name) {
    return name.textContent;
  }
  else {
    return "NO NAME";
  }
}

function checkDeedDate(date) {
  if(date && !(date.textContent == "")) {
    date = date.textContent;
    var thisYear = new Date().getFullYear();
    if((thisYear - date.substring(date.length-4, date.length)) > 5) {
      return date;
    }
    else {
      return null;
    }
  }
  else {
    return "pass";
  }
}

function getPropertyURLs() {
  var links = document.links;
  var urls = [];
  for (var i = 0; i < links.length; i++) {
    if (links[i].href.substring(29, 37) == 'Property') {
      urls.push(links[i].href);
    }
  }
  return urls;
}


/* * *
  @Pre-condition: urls is an array of webpages to be searched
  @Post-condition: rawData is populated with the needed information from all the webpages in urls
* * */
function collectData(urls) {
  for(var i = 0; i < urls.length; i++) {
    scanPage(urls[i], storeMailDetails);
  }
}

function displayRawData() {
  var textData = "<pre><p>";
  for(var i = 0; i < rawData.length; i++) {
    for(var prop in rawData[i]) {
      textData += prop + ": " + rawData[i][prop] + "\n";
    }
  }
  textData += "</p></pre>";
  var dataSheet = window.open("data:text/html," + encodeURIComponent(textData), "_blank", "width=1000,height=1000,toolbar=no,scrollbars,resizable");
  dataSheet.focus();
}

function displayFlaggedData() {
  var textData = "<pre><p>" + "List of Flagged Properties: " + "\n";
  for(var i = 0; i < flagged.length; i++) {
    textData += flagged[i]["property_address"] + "\n";
  }
  textData += "</p></pre>";
  var dataSheet = window.open("data:text/html," + encodeURIComponent(textData), "_blank", "width=1000,height=1000,toolbar=no,scrollbars,resizable");
  dataSheet.focus();
}

function addLabel(printSheet, owner, address) {
  var label = printSheet.createElement('div');
  label.className = "label";
  label.textContent = owner + "\n" + formatAddress(address);
  printSheet.body.appendChild(label);
}

function createLabels() {
  var printSheet = window.open("", "Print Sheet").document;
  formatPS(printSheet);
  for(var i = 0; i < rawData.length; i++) {
    if(rawData[i]["deed_date"]) {
      var propAddr = rawData[i]["property_address"];
      var mailAddr = rawData[i]["mailing_address"];
      if(isSameAddress(propAddr, mailAddr)) {
        addLabel(printSheet, rawData[i]["owner"], propAddr);
      }
      else {
        addLabel(printSheet, rawData[i]["owner"], propAddr);
        addLabel(printSheet, rawData[i]["owner"], mailAddr);
      }
    }
    else {
      flagged.push(rawData[i]);
    }
    if(printSheet.getElementsByClassName('label').length % 30 === 0) {
      addPageBreak(printSheet);
    }
  //  alert(printSheet.getElementsByClassName('label').length % 30 === 0);
  }
  displayFlaggedData();
}

function isSameAddress(address1, address2) {
  if(address1 && address2) {
    if(address1 == address2) {
      return true;
    }
    else {
      if(Math.abs(address1.length - address2.length > 5)) {
        return false;
      }
      else {
        return address1.includes(address2.substring(0, address2.indexOf(" ")));
      }
    }
  }
  else {
    return false;
  }
}

function formatPS(printSheet) {
  var link = printSheet.createElement('link');
  link.href = 'labels.css';
  link.rel = 'stylesheet';
  link.type = 'text/css';
  printSheet.getElementsByTagName('head')[0].appendChild(link);
  var style = printSheet.createElement('style');
  style.textContent = 'body { width: 8.5in; margin: 0in .1875in;} .label{width: 2.025in; height: .9in; padding: .125in .3in 0; margin-right: .20in; float: left; text-align: center; overflow: hidden; white-space: pre-wrap; font-size:90%;} .page-break  {clear: left; display:block; page-break-after:always;}';
  printSheet.getElementsByTagName('head')[0].appendChild(style);
  var pagebreak = printSheet.createElement('div');
  pagebreak.className = 'page-break';
  //printSheet.body.appendChild(pagebreak);
}

function formatAddress(address) {
  if(address.includes("SAN ANTONIO, TX")) {
    var frmtAddr = address.split("SAN ANTONIO, TX");
    return frmtAddr[0].trim() + "\n" + "SAN ANTONIO, TX" + frmtAddr[1];
  }
  else if(address.includes("ELMENDORF, TX")) {
    var frmtAddr = address.split("ELMENDORF, TX");
    return frmtAddr[0].trim() + "\n" + "ELMENDORF, TX" + frmtAddr[1];
  }
  else if(address.includes("MISSOURI CITY, TX")) {
    var frmtAddr = address.split("MISSOURI CITY, TX");
    return frmtAddr[0].trim() + "\n" + "MISSOURI CITY" + frmtAddr[1];
  }
  else if(address.includes("BULVERDE, TX")) {
    var frmtAddr = address.split("BULVERDE, TX");
    return frmtAddr[0].trim() + "\n" + "BULVERDE, TX" + frmtAddr[1];
  }
  else {
    return address;
  }
}

function addPageBreak(doc) {
  var pgbr = doc.createElement('div');
  pgbr.className = ('page-break');
  doc.body.appendChild(pgbr);
}

collectData(getPropertyURLs());
window.setTimeout(createLabels, 7500);
