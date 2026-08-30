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

export function editBook(id, name, price, author, detail) {
  const data = {
    name: name,
    price: price,
    author: author,
    detail: detail
  }
  return fetch("http://localhost:3000/book/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then((response) => {
      return response.json()
    })
}

export function delBook(id) {
  return fetch("http://localhost:3000/book/" + id, {
    method: "DELETE",
  })
    .then((response) => {
      console.log("Deleted >> id: ", id)
    })
}

export function loadBooks() {
  return fetch("http://localhost:3000/book", {
    method: "GET"
  })
    .then((response) => {
      return response.json()
    })
}