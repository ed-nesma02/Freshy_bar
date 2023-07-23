const API_URL = "https://freshy-bar-api.glitch.me/";

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
        <button class="btn cocktail__btn cocktail__btn_add">Добавить</button>
    </div>
    `;
  return cocktail;
};

const modalConroller = ({ modal, btnOpen, time = 300 }) => {
  const buttonElems = document.querySelectorAll(btnOpen);
  const modalElem = document.querySelector(modal);
  modalElem.style.cssText = `
      display: flex;
      visibility: hidden;
      opacity: 0;
      transition: opacity ${time}ms ease-in-out;
      `;

  const openModal = () => {
    modalElem.style.visibility = "visible";
    modalElem.style.opacity = "1";
  };
  const closeModal = (event) => {
    const target = event.target;
    const code = event.code;

    if (target === modalElem || code === "Escape") {
      modalElem.style.opacity = "0";
      setTimeout(() => {
        modalElem.style.visibility = "hidden";
      }, time);
    }
  };
  buttonElems.forEach((buttonElem)=>{
    buttonElem.addEventListener("click", openModal);
  })
  modalElem.addEventListener("click", closeModal);
  window.addEventListener("keydown", closeModal);

  return { openModal, closeModal };
};

const init = async () => {
  modalConroller({ modal: ".modal_order", btnOpen: ".header__btn-order" });
  modalConroller({
    modal: ".modal__constructor",
    btnOpen: ".cocktail__btn_yourself",
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
  modalConroller({ modal: ".modal__add", btnOpen: ".cocktail__btn_add" });
};

init();
