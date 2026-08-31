export function postBook(name, price, author, detail, image) {
    const data = new FormData()
    data.append("name", name)
    data.append("price", price)
    data.append("author", author)
    data.append("detail", detail)
    data.append("image", image)
    return fetch("http://localhost:3001/book", {
          method: "POST",
          body: data
        })
          .then((response) => {
            return response.json()
          })
}

export function editBook(id, name, price, author, detail, image) {
  const data = new FormData()
    data.append("name", name)
    data.append("price", price)
    data.append("author", author)
    data.append("detail", detail)
    data.append("image", image)
    for (const item of data.entries()) {
    console.log(item)
}
  return fetch("http://localhost:3000/book/" + id, {
    method: "PUT",
    body: data
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