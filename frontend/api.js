export function postBook(name, price, author, detail, image) {
    const data = new FormData()
    data.append("name", name)
    data.append("price", price)
    data.append("author", author)
    data.append("detail", detail)
    data.append("image", image)
    return fetch("http://localhost:3000/book", {
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

export function createOrder(data) {
  return fetch("http://localhost:3000/order", {
    method: "POST",
    headers:  {
            "Content-Type": "application/json"
        },
    body: JSON.stringify(data)
  })
  .then(response => {

        if (!response.ok) {
            throw new Error("Create order failed")
        }

        return response.json()
    })
}

export function getOrder(id) {
    return fetch(`http://localhost:3000/order/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Get order failed")
            }

            return response.json()
        })
}