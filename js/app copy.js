function run() {
  console.log("enter to run function");
  let htmlCode = document.getElementById("html-code").value;
  let cssCode = document.getElementById("css-code").value;
  let jsCode = document.getElementById("js-code").value;
  let output = document.getElementById("output");
  console.log(htmlCode);
  output.contentDocument.body.innerHTML =
    htmlCode + "<style>" + cssCode + "</style>";
  output.contentWindow.eval(jsCode);
}

window.run = run;
