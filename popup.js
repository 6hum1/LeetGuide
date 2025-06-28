function getProblemNameFromUrl() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const url = tabs[0].url;
    const match = url.match(/problems\/([^/]+)/);
    const problemName = match ? match[1] : null;

    console.log("Problem Name:", problemName); // e.g., "longest-subsequence-repeated-k-times"

    // You can now send this to Gemini or use it for API purposes
  });
}

document.getElementById("get-hint").addEventListener("click", () => {
  const resultDiv = document.getElementById("result");

  // get the user's api key
  chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
    if (!geminiApiKey) {
      resultDiv.textContent =
        "No API Key set . Click the gear icon to add one.";
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      const url = tabs[0].url;
      const match = url.match(/problems\/([^/]+)/);
      const problemName = match ? match[1] : null;
    
      if(!problemName){
        resultDiv.textContent = "Couln't extract text from this page."
        return ;
      }
      console.log("Problem Name:", problemName);

      try {
        const summary = await getGeminiSummary(problemName,getHint,geminiApiKey)
        resultDiv.textContent = summary;
      }catch(error){
        resultDiv.textContent = "Gemini error " + error.message;
      }
    });
  });
});
document.getElementById("show-solution").addEventListener("click", () => {
  const resultDiv = document.getElementById("result");

  // get the user's api key
  chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
    if (!geminiApiKey) {
      resultDiv.textContent =
        "No API Key set . Click the gear icon to add one.";
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      const url = tabs[0].url;
      const match = url.match(/problems\/([^/]+)/);
      const problemName = match ? match[1] : null;
    
      if(!problemName){
        resultDiv.textContent = "Couln't extract text from this page."
        return ;
      }
      console.log("Problem Name:", problemName);

      try {
        const summary = await getGeminiSummary(problemName,getFullSolution,geminiApiKey)
        resultDiv.textContent = summary;
      }catch(error){
        resultDiv.textContent = "Gemini error " + error.message;
      }
    });
  });
});

async function getGeminiSummary(problemName,type,apiKey){
    const promptMap = {
        getHint : `Give me a hint (not the full solution) for the LeetCode problem titled '${problemName}'. Just a small nudge to help me approach the problem.`,
        getFullSolution : `Explain and provide the full solution for the LeetCode problem titled '${problemName}'. Include an intuitive explanation followed by well-written code.`,
    }
    const prompt = promptMap[type] || promptMap.getHint;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,{
        method : "POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            contents : [{parts : [{text : prompt}]}],
            generationConfig:{temperature : 0.2},
        })

    })

    if(!res.ok){
        const {error} = await res.json();
        throw new Error(error?.message || "Request failed");
    }

    const data = await res.json();

    return data.canditates?.[0]?.content?.parts?.[0]?.text??"No Summary";
}
