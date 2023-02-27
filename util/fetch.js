async function GetFact() {
  const response = await fetch(
    "https://api.thecatapi.com/v1/images/search?has_breeds=1?api_key=PLACE_YOUR_API_KEY_HERE"
  );

  const obj = await response.json();
  JSON.parse(JSON.stringify(obj));
  const response2 = await fetch("https://api.thecatapi.com/v1/images/" + obj[0].id);
  const obj2 = await response2.json();
  return obj2;
}

export default GetFact;
