export function postBook(data) {
    return fetch("http://localhost:3000/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        })
          .then((response) => {
            return response.json()
          })
}