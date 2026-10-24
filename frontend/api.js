
export function postBook(name, price, author, detail, image) {
  const data = {
    name,
    price,
    author,
    detail,
    image: "/images/newbook.png"
  }

  return fetch("http://localhost:3000/book", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }
    return response.json()
  })
}



export function editBook(id, name, price, author, detail, image) {
  const data = {
    name,
    price,
    author,
    detail,
    image
  }

  return fetch("http://localhost:3000/book/" + id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
    .then(async (response) => {
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "แก้ไขหนังสือไม่สำเร็จ")
      }

      return result
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

export function getUnassignedOrders() {

    return fetch("http://localhost:3000/order/unassigned")
        .then(response => {

            if (!response.ok) {
                throw new Error("Get orders failed")
            }

            return response.json()
        })
}

export function assignOrder(id_order, id_emp) {

    return fetch(
        `http://localhost:3000/order/${id_order}/assign`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id_emp: id_emp
            })
        }
    )
    .then(response => {

        if (!response.ok) {
            throw new Error("Assign order failed")
        }

        return response.json()
    })
}

export function updateOrderStatus(id_order, status) {

    return fetch(
        `http://localhost:3000/order/${id_order}/status`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: status
            })
        }
    )
    .then(async response => {

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message)
        }

        return data
    })
}

export function getEmployeeOrders(id_emp) {

    return fetch(
        `http://localhost:3000/order/employee/${id_emp}`
    )
        .then(async response => {

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message)
            }

            return data
        })
}

export function getCustomerOrders(id_cust) {

    return fetch(
        `http://localhost:3000/order/customer/${id_cust}`
    )
        .then(async response => {

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message)
            }

            return data
        })
}

export function getAccount(id_acc) {

    return fetch(
        `http://localhost:3000/account/${id_acc}`
    )
        .then(async response => {

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message)
            }

            return data
        })
}

export function login(username, password) {

    return fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
        .then(async response => {

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message)
            }

            return data
        })
}

export function addWishlist(id_cust, id_product) {

    return fetch("http://localhost:3000/wishlist", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id_cust: id_cust,
            id_product: id_product
        })
    })
    .then(async response => {

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message)
        }

        return data
    })
}

export function getWishlist(id_cust) {

    return fetch(
        `http://localhost:3000/wishlist/customer/${id_cust}`
    )
    .then(async response => {

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message)
        }

        return data
    })
}

export function deleteWishlist(id_wishlist) {

    return fetch(
        `http://localhost:3000/wishlist/${id_wishlist}`,
        {
            method: "DELETE"
        }
    )
    .then(async response => {

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message)
        }

        return data
    })
}

export function updateAccount(
    id_acc,
    fname,
    lname,
    birthyear,
    address,
    tel
) {

    return fetch(
        `http://localhost:3000/account/${id_acc}`,
        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                fname: fname,
                lname: lname,
                birthyear: birthyear,
                address: address,
                tel: tel
            })
        }
    )
    .then(async response => {

        const data =
            await response.json()

        if (!response.ok) {

            throw new Error(
                data.message || "Update failed"
            )
        }

        return data
    })
}

export function register(
    fname,
    lname,
    birthyear,
    address,
    tel,
    username,
    password
) {

    return fetch(
        "http://localhost:3000/register",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                fname: fname,
                lname: lname,
                birthyear: birthyear,
                address: address,
                tel: tel,
                username: username,
                password: password
            })
        }
    )
        .then(async response => {

            const data =
                await response.json()

            if (!response.ok) {
                throw new Error(
                    data.message || "Register failed"
                )
            }

            return data
        })
}

export function uploadPaymentSlip(
    id_order,
    file
) {

    const formData =
        new FormData()

    formData.append(
        "slip",
        file
    )

    return fetch(
        `http://localhost:3000/order/${id_order}/slip`,
        {
            method: "POST",
            body: formData
        }
    )
        .then(async response => {

            const data =
                await response.json()

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Upload failed"
                )
            }

            return data
        })
}

// GET: แสดงรายชื่อลูกค้าที่สามารถแต่งตั้งเป็น Staff ได้
export function getEligibleCustomers(id_emp) {
    return fetch(
        `http://localhost:3000/manager/${id_emp}/eligible-customers`
    )
        .then(async response => {
            const data = await response.json()

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load customers"
                )
            }

            return data
        })
}


// POST: แต่งตั้ง Customer เป็น Staff
export function promoteCustomerToStaff(id_emp, id_cust) {
    return fetch(
        `http://localhost:3000/manager/${id_emp}/promote/${id_cust}`,
        {
            method: "POST"
        }
    )
        .then(async response => {
            const data = await response.json()

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to promote customer"
                )
            }

            return data
        })
}