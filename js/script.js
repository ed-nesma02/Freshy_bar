const API_URL = "http://localhost:3000/"; //https://freshy-bar-api.glitch.me/

const price = {
  Клубника: 60,
  Банан: 50,
  Манго: 70,
  Киви: 55,
  Маракуйя: 90,
  Яблоко: 45,
  Мята: 50,
  Лед: 10,
  Биоразлагаемый: 20,
  Пластиковый: 0,
};

const cartDataControl = {
  get() {
    return JSON.parse(localStorage.getItem("FreshyBarCart") || "[]");
  },
  add(item) {
    const cartData = this.get();
    item.idls = Math.random().toString(36).substring(2, 8);
    cartData.push(item);
    localStorage.setItem("FreshyBarCart", JSON.stringify(cartData));
  },
  remove(idls) {
    const cartData = this.get();
    const index = cartData.findIndex((item) => item.idls === idls);
    if (index !== -1) {
      cartData.splice(index, -1);
    }
    localStorage.setItem("FreshyBarCart", JSON.stringify(cartData));
  },
  clear() {
    localStorage.removeItem("FreshyBarCart");
  },
};

const getData = async () => {
  const response = await fetch(`${API_URL}api/goods`);
  const data = await response.json();
  return data;
};

const createCard = (item) => {
  const cocktail = document.createElement("article");
  cocktail.classList.add("cocktail");
  cocktail.innerHTML = `
    <img src="${API_URL}${item.image}" alt="${item.title}" class="cocktail__img">
    <div class="cocktail__content">
        <div class="cocktail__text">
            <h3 class="cocktail__title">${item.title}</h3>
            <div class="cocktail__information">
                <p class="cocktail__price">${item.price} ₽</p>
                <p class="cocktail__size">${item.size}</p>
            </div>
        </div>
        <button class="btn cocktail__btn cocktail__btn_add" data-id="${item.id}">Добавить</button>
    </div>
    `;
  return cocktail;
};

const scrollService = {
  scrollPosition: 0,
  disabledScroll() {
    this.scrollPosition = window.scrollY;
    document.documentElement.style.scrollBehavior = "auto";
    document.body.style.cssText = `
    overflow: hidden;
    position: fixed;
    top: -${this.scrollPosition}px;
    left: 0;
    width: 100vw;
    padding-right: ${window.innerWidth - document.body.offsetWidth}px;
    `;
  },
  enabledScroll() {
    document.body.style.cssText = "";
    window.scroll({ top: this.scrollPosition });
    document.documentElement.style.scrollBehavior = "";
  },
};

const modalConroller = ({ modal, btnOpen, time = 300, open, close }) => {
  const buttonElems = document.querySelectorAll(btnOpen);
  const modalElem = document.querySelector(modal);
  modalElem.style.cssText = `
      display: flex;
      visibility: hidden;
      opacity: 0;
      transition: opacity ${time}ms ease-in-out;
      `;

  const openModal = (e) => {
    if (open) {
      open({ btn: e.target });
    }
    modalElem.style.visibility = "visible";
    modalElem.style.opacity = "1";
    window.addEventListener("keydown", closeModal);
    scrollService.disabledScroll();
  };
  const closeModal = (event) => {
    const target = event.target;
    const code = event.code;

    if (event === "close" || target === modalElem || code === "Escape") {
      modalElem.style.opacity = "0";
      setTimeout(() => {
        modalElem.style.visibility = "hidden";
        scrollService.enabledScroll();
        if (close) {
          close();
        }
      }, time);
    }
    window.removeEventListener("keydown", closeModal);
  };
  buttonElems.forEach((buttonElem) => {
    buttonElem.addEventListener("click", openModal);
  });
  modalElem.addEventListener("click", closeModal);

  modalElem.openModal = openModal;
  modalElem.closeModal = closeModal;

  return { openModal, closeModal };
};

const getFormData = (form) => {
  const formData = new FormData(form);
  const data = {};
  for (const [name, value] of formData.entries()) {
    if (data[name]) {
      if (!Array.isArray(data[name])) {
        data[name] = [data[name]];
      }
      data[name].push(value);
    } else {
      data[name] = value;
    }
  }
  return data;
};

const calculateTotalPrice = (form, startPrice) => {
  let totalPrice = startPrice;

  const data = getFormData(form);

  if (Array.isArray(data.ingredients)) {
    data.ingredients.forEach((item) => {
      totalPrice += price[item] || 0;
    });
  } else {
    totalPrice += price[data.ingredients] || 0;
  }

  if (Array.isArray(data.topping)) {
    data.topping.forEach((item) => {
      totalPrice += price[item] || 0;
    });
  } else {
    totalPrice += price[data.topping] || 0;
  }
  totalPrice += price[data.cup] || 0;

  return totalPrice;
};

const formControl = (form, cb) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = getFormData(form);
    cartDataControl.add(data);

    if (cb) {
      cb();
    }
  });
};

const calculateMakeYourOwn = () => {
  const modalMake = document.querySelector(".modal_make");
  const makeInputTitle = modalMake.querySelector(".make__input-title");
  const formMakeOwn = modalMake.querySelector(".make__form_make-your-own");
  const makeInputPrice = modalMake.querySelector(".make__input_price");
  const makeTotalPrice = modalMake.querySelector(".make__total-price");
  const makeAddBbtn = modalMake.querySelector(".make__add-btn");

  const handlerChange = () => {
    const totalPrice = calculateTotalPrice(formMakeOwn, 150);

    const data = getFormData(formMakeOwn);

    if (data.ingredients) {
      const ingredients = Array.isArray(data.ingredients)
        ? data.ingredients.join(", ")
        : data.ingredients;

      makeInputTitle.value = `Конструктор: ${ingredients}`;
      makeAddBbtn.disabled = false;
    } else {
      makeAddBbtn.disabled = true;
    }

    makeInputPrice.value = totalPrice;
    makeTotalPrice.textContent = `${totalPrice} ₽`;
  };

  formMakeOwn.addEventListener("change", handlerChange);
  formControl(formMakeOwn, () => {
    modalMake.closeModal("close");
  });
  handlerChange();

  const resetForm = () => {
    makeTotalPrice.textContent = "150";
    makeAddBbtn.disabled = true;
    formMakeOwn.reset();
  };

  return { resetForm };
};

const calculateAdd = () => {
  const modalAdd = document.querySelector(".modal_add");
  const formAdd = document.querySelector(".make__form_add");
  const makeTitle = modalAdd.querySelector(".make__title");
  const makeInputStartPrice = modalAdd.querySelector(
    ".make__input-start-price"
  );
  const makeInputTitle = modalAdd.querySelector(".make__input-title");
  const makeInputPrice = modalAdd.querySelector(".make__input-price");
  const makeTotalPrice = modalAdd.querySelector(".make__total-price");
  const makeInputSize = modalAdd.querySelector(".make__input-size");
  const makeTotalSize = modalAdd.querySelector(".make__total-size");

  const handlerChange = () => {
    const totalPrice = calculateTotalPrice(formAdd, +makeInputStartPrice.value);
    makeInputPrice.value = totalPrice;
    makeTotalPrice.textContent = `${totalPrice} ₽`;
  };

  formAdd.addEventListener("change", handlerChange);
  formControl(formAdd, () => {
    modalAdd.closeModal("close");
  });

  const fillInForm = (data) => {
    makeTitle.textContent = data.title;
    makeInputTitle.value = data.title;
    makeInputStartPrice.value = data.price;
    makeInputPrice.value = data.price;
    makeTotalPrice.textContent = `${data.price} ₽`;
    makeInputSize.value = data.size;
    makeTotalSize.textContent = data.size;
    handlerChange();
  };

  const resetForm = () => {
    makeTitle.textContent = "";
    makeTotalPrice.textContent = "";
    makeTotalSize.textContent = "";
    formAdd.reset();
  };

  return { fillInForm, resetForm };
};

const createCartItem = (item) => {
  const li = document.createElement("li");
  li.classList.add("order__item");
  li.innerHTML = `
  <img src="img/make-your-own.png" alt="${item.title}" class="order__img">
  <div class="order__info">
      <h3 class="order__name">${item.title}</h3>
      <ul class="order__topping-list">
          <li class="order__topping-item">${item.size}</li>
          <li class="order__topping-item">${item.cup}</li>
          ${
            item.topping
              ? Array.isArray(item.topping)
                ? item.topping.map(
                    (topping) =>
                      `<li class="order__topping-item">${topping}</li>`
                  )
                : `<li class="order__topping-item">${item.topping}</li>`
              : ""
          }
      </ul>
  </div>
  <button class="order__item-delete" aria-label="Удалить коктейл из корзины" data-idls="${
    item.idls
  }"></button>
  <p class="order__item-price">${item.price}&nbsp;₽</p>
  `;

  return li;
};

const renderCart = () => {
  const modalOrder = document.querySelector(".modal_order");
  const orderCount = modalOrder.querySelector(".order_count");
  const orderList = modalOrder.querySelector(".order__list");
  const orderTotalPrice = modalOrder.querySelector(".order__total-price");
  const orderForm = modalOrder.querySelector(".order__form");

  const orderListData = cartDataControl.get();

  orderList.textContent = "";
  orderCount.textContent = `(${orderListData.length})`;
  orderListData.forEach((item) => {
    orderList.append(createCartItem(item));
  });

  orderTotalPrice.textContent = `${orderListData.reduce(
    (acc, item) => acc + +item.price,
    0
  )} ₽`;

  orderForm.addEventListener("submit", async (event) => {
    event.preventDefault;
    if (!orderListData.length) {
      return alert("Корзина пустая");
    } else {
      const data = getFormData(orderForm);
      const response = await fetch(`${API_URL}api/order`, {
        method: "Post",
        body: JSON.stringify({
          ...data,
          products: orderListData,
        }),
        headers: {
          "Content-type": "application/json"
        }
      })
      const {message} = await response.json();
      alert(message);
      cartDataControl.clear();
      orderForm.reset();
      modalOrder.close("close");
    }
  });
};

const init = async () => {
  modalConroller({
    modal: ".modal_order",
    btnOpen: ".header__btn-order",
    open: renderCart,
  });

  const { resetForm: resetFormMakeYourOwn } = calculateMakeYourOwn();

  modalConroller({
    modal: ".modal_make",
    btnOpen: ".cocktail__btn_yourself",
    close: resetFormMakeYourOwn,
  });

  const goodsListElem = document.querySelector(".goods__list");
  const data = await getData();

  const cartCocktail = data.map((item) => {
    const li = document.createElement("li");
    li.classList.add("goods__item");
    li.append(createCard(item));
    return li;
  });

  goodsListElem.append(...cartCocktail);

  const { fillInForm: fillInFormAdd, resetForm: resetFormAdd } = calculateAdd();

  modalConroller({
    modal: ".modal_add",
    btnOpen: ".cocktail__btn_add",
    open({ btn }) {
      const id = btn.dataset.id;
      const item = data.find((item) => item.id.toString() === id);
      fillInFormAdd(item);
    },
    close: resetFormAdd,
  });
};

init();
