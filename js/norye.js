(function () {
  "use strict";

  var CART_KEY = "norye-cart";
  var ITEM_PRICE = 1299;
  var COLLECTION_VIEW_KEY = "norye-collection-view";
  var awakenHeroShowcase = null;
  var lastCartCodes = [];
  var cartUiInitialized = false;
  var priceRevealObserver = null;

  function productUrl(code) {
    return "product.html?code=" + encodeURIComponent(code);
  }

  function collectionUrl(category) {
    return category === "men" ? "men.html" : "women.html";
  }

  function orderUrl() {
    if (typeof NORYE_WHATSAPP_PHONE !== "undefined" && NORYE_WHATSAPP_PHONE) {
      return "https://wa.me/" + NORYE_WHATSAPP_PHONE;
    }
    return typeof NORYE_ORDER_URL !== "undefined" ? NORYE_ORDER_URL : "https://wa.me/254721754234";
  }

  function buildOrderMessage(checkout) {
    var cart = getCart();
    var lines = [
      "Hello NŌRYE Team,",
      "",
      "I would like to place an order:",
      ""
    ];

    cart.forEach(function (item) {
      var product = getProductByCode(item.code);
      if (!product) return;
      lines.push(
        "• " + product.number + " — Inspired by " + product.inspiredBy +
        " (Qty: " + item.qty + ") — " + formatPrice(item.qty * ITEM_PRICE)
      );
    });

    lines.push("");
    lines.push("*Order total: " + formatPrice(getCartTotal(cart)) + "*");
    lines.push("");
    lines.push("Customer details:");
    lines.push("Name: " + checkout.name);
    lines.push("WhatsApp: " + checkout.phone);
    lines.push("Delivery: " + checkout.location);
    if (checkout.notes) {
      lines.push("Notes: " + checkout.notes);
    }
    lines.push("");
    lines.push("Please confirm availability and delivery. Thank you.");

    return lines.join("\n");
  }

  function buildWhatsAppOrderUrl(checkout) {
    return orderUrl() + "?text=" + encodeURIComponent(buildOrderMessage(checkout));
  }

  function normalizeCart(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(function (item) {
      if (typeof item === "string") {
        return { code: item, qty: 1 };
      }
      if (item && item.code) {
        return { code: item.code, qty: Math.max(1, parseInt(item.qty, 10) || 1) };
      }
      return null;
    }).filter(Boolean);
  }

  function getCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      return raw ? normalizeCart(JSON.parse(raw)) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function clearLegacyCheckoutStorage() {
    try {
      localStorage.removeItem("norye-checkout");
    } catch (e) {}
  }

  function getCartItemCount(cart) {
    return cart.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
  }

  function getCartTotal(cart) {
    return cart.reduce(function (sum, item) {
      return sum + item.qty * ITEM_PRICE;
    }, 0);
  }

  function findCartItem(cart, code) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].code === code) return cart[i];
    }
    return null;
  }

  function openCartPanel() {
    var el = document.getElementById("offcanvasCart");
    if (el && typeof bootstrap !== "undefined") {
      bootstrap.Offcanvas.getOrCreateInstance(el).show();
    }
  }

  function flyToCart(sourceEl, productCode) {
    if (prefersReducedMotion() || !sourceEl) return;

    var product = getProductByCode(productCode);
    if (!product) return;

    var cartBtn = document.querySelector('.norye-nav-btn[data-bs-target="#offcanvasCart"]');
    if (!cartBtn) return;

    var sourceRect = sourceEl.getBoundingClientRect();
    var targetRect = cartBtn.getBoundingClientRect();
    var startX = sourceRect.left + sourceRect.width / 2;
    var startY = sourceRect.top + sourceRect.height / 2;
    var endX = targetRect.left + targetRect.width / 2;
    var endY = targetRect.top + targetRect.height / 2;

    var fly = document.createElement("div");
    fly.className = "norye-cart-fly";
    fly.innerHTML = '<img src="' + product.image + '" alt="">';
    fly.style.left = startX + "px";
    fly.style.top = startY + "px";
    document.body.appendChild(fly);

    var startTime = null;
    var duration = 600;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = easeOutCubic(progress);
      var x = startX + (endX - startX) * eased;
      var y = startY + (endY - startY) * eased;
      var scale = 1 - eased * 0.6;
      fly.style.transform = "translate(-50%, -50%) translate(" + (x - startX) + "px, " + (y - startY) + "px) scale(" + scale + ")";
      fly.style.opacity = String(1 - eased * 0.35);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        fly.remove();
        cartBtn.classList.add("is-bumped");
        window.setTimeout(function () {
          cartBtn.classList.remove("is-bumped");
        }, 400);
      }
    }

    window.requestAnimationFrame(step);
  }

  function addToCart(code, options) {
    options = options || {};
    var cart = getCart();
    var existing = findCartItem(cart, code);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ code: code, qty: 1 });
    }
    saveCart(cart);
    renderCartUI();
    if (options.openCart) openCartPanel();
    if (options.button) {
      flyToCart(options.button, code);
      var btn = options.button;
      if (btn.classList.contains("is-added")) return;
      var original = btn.textContent;
      btn.textContent = "Added ✓";
      btn.classList.add("is-added");
      btn.disabled = true;
      window.setTimeout(function () {
        btn.textContent = original;
        btn.classList.remove("is-added");
        btn.disabled = false;
      }, 2000);
    }
  }

  function removeFromCart(code) {
    var cart = getCart().filter(function (item) {
      return item.code !== code;
    });
    saveCart(cart);
    renderCartUI();
  }

  function updateCartQty(code, delta) {
    var cart = getCart();
    var item = findCartItem(cart, code);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(function (i) {
        return i.code !== code;
      });
    }
    saveCart(cart);
    renderCartUI();
  }

  function formatPrice(amount) {
    return "Ksh " + amount.toLocaleString();
  }

  function renderCartUI() {
    var cart = getCart();
    var count = getCartItemCount(cart);
    var prevCodes = lastCartCodes.slice();
    var newCodes = cart.map(function (item) {
      return item.code;
    });
    var addedCodes = cartUiInitialized
      ? newCodes.filter(function (code) {
          return prevCodes.indexOf(code) === -1;
        })
      : [];

    document.querySelectorAll(".cart-count").forEach(function (el) {
      el.textContent = count > 0 ? String(count) : "";
    });

    var badge = document.getElementById("cart-badge");
    if (badge) {
      badge.textContent = count > 0 ? String(count) : "";
    }

    var list = document.getElementById("cart-items-list");
    var empty = document.getElementById("cart-empty");
    var content = document.getElementById("cart-content");
    var totalEl = document.getElementById("cart-total");
    var countLabel = document.getElementById("cart-item-count-label");
    var errorEl = document.getElementById("checkout-error");

    if (!list) return;

    if (count === 0) {
      list.innerHTML = "";
      lastCartCodes = [];
      cartUiInitialized = true;
      if (empty) empty.hidden = false;
      if (content) content.hidden = true;
      if (errorEl) errorEl.textContent = "";
      return;
    }

    if (empty) empty.hidden = true;
    if (content) content.hidden = false;
    if (errorEl) errorEl.textContent = "";

    if (countLabel) {
      countLabel.textContent = count === 1 ? "1 item" : count + " items";
    }

    list.innerHTML = cart.map(function (item) {
      var product = getProductByCode(item.code);
      if (!product) return "";
      return (
        '<li class="norye-cart-item">' +
          '<div class="norye-cart-item-inner">' +
            '<img src="' + product.image + '" alt="' + product.name + '" class="norye-cart-item-img">' +
            '<div class="norye-cart-item-details">' +
              '<span class="norye-cart-item-title">' + product.number + "</span>" +
              '<span class="norye-cart-item-inspired">' + product.inspiredBy + "</span>" +
            "</div>" +
            '<div class="norye-cart-item-controls">' +
              '<div class="norye-cart-item-row">' +
                '<div class="norye-cart-qty">' +
                  '<button type="button" class="norye-qty-btn" data-qty-minus="' + product.code + '" aria-label="Decrease quantity">−</button>' +
                  '<span class="norye-qty-value">' + item.qty + "</span>" +
                  '<button type="button" class="norye-qty-btn" data-qty-plus="' + product.code + '" aria-label="Increase quantity">+</button>' +
                "</div>" +
                '<span class="norye-cart-item-price">' + formatPrice(item.qty * ITEM_PRICE) + "</span>" +
              "</div>" +
              '<button type="button" class="norye-cart-remove" data-remove-cart="' + product.code + '">Remove</button>' +
            "</div>" +
          "</div>" +
        "</li>"
      );
    }).join("");

    if (!prefersReducedMotion() && addedCodes.length) {
      addedCodes.forEach(function (code) {
        var removeBtn = list.querySelector('[data-remove-cart="' + code + '"]');
        if (!removeBtn) return;
        var item = removeBtn.closest(".norye-cart-item");
        if (!item) return;
        item.classList.add("is-entering");
        item.addEventListener("animationend", function () {
          item.classList.remove("is-entering");
        }, { once: true });
      });
    }

    lastCartCodes = newCodes;
    cartUiInitialized = true;

    var cartTotal = getCartTotal(cart);
    if (totalEl) totalEl.textContent = formatPrice(cartTotal);
  }

  function initCheckoutForm() {
    var nameEl = document.getElementById("checkout-name");
    var notesEl = document.getElementById("checkout-notes");
    var phoneEl = document.getElementById("checkout-phone");
    var locationEl = document.getElementById("checkout-location");
    var form = document.getElementById("cart-checkout-form");
    var orderBtn = document.getElementById("cart-order-btn");

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (orderBtn) orderBtn.click();
      });
    }

    if (!orderBtn) return;

    orderBtn.addEventListener("click", function () {
      var name = nameEl ? nameEl.value.trim() : "";
      var phone = phoneEl ? phoneEl.value.trim() : "";
      var location = locationEl ? locationEl.value.trim() : "";
      var notes = notesEl ? notesEl.value.trim() : "";
      var errorEl = document.getElementById("checkout-error");

      if (getCartItemCount(getCart()) === 0) {
        if (errorEl) errorEl.textContent = "Your cart is empty.";
        return;
      }

      if (!name) {
        if (errorEl) errorEl.textContent = "Please enter your full name.";
        if (nameEl) nameEl.focus();
        return;
      }

      if (!phone) {
        if (errorEl) errorEl.textContent = "Please enter your WhatsApp number.";
        if (phoneEl) phoneEl.focus();
        return;
      }

      if (!location) {
        if (errorEl) errorEl.textContent = "Please enter your delivery location.";
        if (locationEl) locationEl.focus();
        return;
      }

      if (errorEl) errorEl.textContent = "";

      var checkoutData = { name: name, phone: phone, location: location, notes: notes };
      window.open(buildWhatsAppOrderUrl(checkoutData), "_blank", "noopener");

      if (form) form.reset();
    });
  }

  function bindCartEvents() {
    document.body.addEventListener("click", function (e) {
      var addBtn = e.target.closest("[data-add-cart]");
      if (addBtn) {
        e.preventDefault();
        addToCart(addBtn.getAttribute("data-add-cart"), {
          button: addBtn,
          openCart: addBtn.hasAttribute("data-open-cart")
        });
        return;
      }
      var minusBtn = e.target.closest("[data-qty-minus]");
      if (minusBtn) {
        e.preventDefault();
        updateCartQty(minusBtn.getAttribute("data-qty-minus"), -1);
        return;
      }
      var plusBtn = e.target.closest("[data-qty-plus]");
      if (plusBtn) {
        e.preventDefault();
        updateCartQty(plusBtn.getAttribute("data-qty-plus"), 1);
        return;
      }
      var removeBtn = e.target.closest("[data-remove-cart]");
      if (removeBtn) {
        e.preventDefault();
        var code = removeBtn.getAttribute("data-remove-cart");
        var item = removeBtn.closest(".norye-cart-item");
        if (item && !prefersReducedMotion() && !item.classList.contains("is-removing")) {
          item.classList.add("is-removing");
          window.setTimeout(function () {
            removeFromCart(code);
          }, 280);
        } else {
          removeFromCart(code);
        }
      }
    });
  }

  function filterProducts(query) {
    query = (query || "").trim().toLowerCase();
    if (!query) return NORYE_PRODUCTS.slice();
    return NORYE_PRODUCTS.filter(function (p) {
      return (
        p.number.toLowerCase().indexOf(query) !== -1 ||
        p.name.toLowerCase().indexOf(query) !== -1 ||
        p.inspiredBy.toLowerCase().indexOf(query) !== -1 ||
        p.code.toLowerCase().indexOf(query) !== -1
      );
    });
  }

  function renderSearchResults(products, list) {
    if (!list) return;

    if (!products.length) {
      list.innerHTML = '<li class="search-no-results">No perfumes found</li>';
      return;
    }

    list.innerHTML = products.map(function (p) {
      return (
        '<li class="cat-list-item">' +
          '<a href="' + productUrl(p.code) + '" data-product-code="' + p.code + '">' +
            '<span class="norye-search-number">' + p.number + "</span>" +
            '<span class="norye-search-inspired">Inspired by ' + p.inspiredBy + "</span>" +
          "</a>" +
        "</li>"
      );
    }).join("");
  }

  function bindSearchInput(input, list, options) {
    if (!input || !list) return;

    options = options || {};

    function showResults() {
      if (list.hasAttribute("hidden")) list.removeAttribute("hidden");
    }

    function hideResults() {
      list.setAttribute("hidden", "");
    }

    input.addEventListener("input", function () {
      renderSearchResults(filterProducts(input.value), list);
      showResults();
    });

    input.addEventListener("focus", function () {
      renderSearchResults(filterProducts(input.value), list);
      showResults();
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        input.value = "";
        hideResults();
        input.blur();
      }
    });

    input.addEventListener("blur", function () {
      window.setTimeout(function () {
        hideResults();
      }, 180);
    });

    list.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });

    list.addEventListener("click", function (e) {
      var link = e.target.closest("a[data-product-code]");
      if (!link) return;
      e.preventDefault();
      e.stopPropagation();
      if (options.onNavigate) options.onNavigate();
      navigateToProduct(link.getAttribute("data-product-code"));
    });

    if (options.form) {
      options.form.addEventListener("submit", function (e) {
        e.preventDefault();
        var results = filterProducts(input.value);
        if (results.length >= 1) {
          if (options.onNavigate) options.onNavigate();
          navigateToProduct(results[0].code);
        } else {
          renderSearchResults(results, list);
          showResults();
        }
      });
    }
  }

  function navigateToProduct(code) {
    window.location.href = productUrl(code);
  }

  function closeSearchPopup() {
    var popup = document.querySelector(".search-popup");
    if (popup) popup.classList.remove("is-visible");
  }

  function openSearchPopup() {
    var popup = document.querySelector(".search-popup");
    var input = document.getElementById("search-form");
    if (!popup) return;
    popup.classList.add("is-visible");
    if (input) {
      input.value = "";
      renderSearchResults(NORYE_PRODUCTS, document.getElementById("search-product-list"));
      window.setTimeout(function () {
        input.focus();
      }, 100);
    }
  }

  function initMobileMenuActions() {
    document.querySelectorAll("[data-open-search-from-menu]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.setTimeout(function () {
          openSearchPopup();
        }, 320);
      });
    });

    document.querySelectorAll("[data-open-cart-from-menu]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.setTimeout(function () {
          openCartPanel();
        }, 320);
      });
    });
  }

  function initSearch() {
    var popupInput = document.getElementById("search-form");
    var popupForm = popupInput ? popupInput.closest("form") : null;
    var popupList = document.getElementById("search-product-list");
    var navInput = document.getElementById("nav-search-input");
    var navList = document.getElementById("nav-search-results");
    var popup = document.querySelector(".search-popup");
    var closeBtn = document.querySelector(".search-popup-close");

    if (popupList) {
      renderSearchResults(NORYE_PRODUCTS, popupList);
    }

    if (popupInput && popupList) {
      bindSearchInput(popupInput, popupList, {
        form: popupForm,
        onNavigate: closeSearchPopup
      });
    }

    if (navInput && navList) {
      bindSearchInput(navInput, navList);
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeSearchPopup();
      });
    }

    if (popup) {
      popup.addEventListener("click", function (e) {
        if (e.target === popup) closeSearchPopup();
      });
    }
  }

  function renderProductCardMedia(product, badge) {
    return (
      '<div class="norye-product-card-media">' +
        '<a href="' + productUrl(product.code) + '" class="norye-product-card-image">' +
          badge +
          '<img src="' + product.image + '" alt="' + product.name + '" class="img-fluid" loading="lazy">' +
        "</a>" +
        '<button type="button" class="norye-add-cart" data-add-cart="' + product.code + '" data-open-cart>Add to Cart</button>' +
      "</div>"
    );
  }

  function renderProductCardBody(product) {
    return (
      '<div class="norye-product-card-body">' +
        '<h5 class="norye-product-title"><a href="' + productUrl(product.code) + '">' + product.number + "</a></h5>" +
        '<div class="norye-product-card-meta">' +
          '<p class="norye-product-inspired">Inspired by ' + product.inspiredBy + "</p>" +
          '<p class="norye-product-price">' + product.price + "</p>" +
        "</div>" +
        '<a href="' + productUrl(product.code) + '" class="norye-product-details">View Details</a>' +
      "</div>"
    );
  }

  function renderProductCard(product, options) {
    options = options || {};
    var badge = "";
    if (options.badge === "featured") {
      badge = '<span class="norye-badge norye-badge-featured">Featured</span>';
    } else if (options.badge === "bestseller") {
      badge = '<span class="norye-badge norye-badge-bestseller">Best Seller</span>';
    }

    var colClass = "col-6 col-md-4 col-lg-3";
    var colAttrs = 'class="' + colClass;
    if (options.animate) {
      colAttrs += ' norye-card-reveal" style="--reveal-delay: ' + ((options.index || 0) * 80) + 'ms"';
    } else {
      colAttrs += '"';
    }

    return (
      "<div " + colAttrs + ">" +
        '<div class="norye-product-card h-100">' +
          renderProductCardMedia(product, badge) +
          renderProductCardBody(product) +
        "</div>" +
      "</div>"
    );
  }

  function renderProductSlide(product, options) {
    options = options || {};
    var badge = options.badge === "featured"
      ? '<span class="norye-badge norye-badge-featured">Featured</span>'
      : options.badge === "bestseller"
        ? '<span class="norye-badge norye-badge-bestseller">Best Seller</span>'
        : "";

    return (
      '<div class="swiper-slide">' +
        '<div class="norye-product-card norye-product-card-slide h-100">' +
          renderProductCardMedia(product, badge) +
          renderProductCardBody(product) +
        "</div>" +
      "</div>"
    );
  }

  function renderGrid(containerId, products, options) {
    options = options || {};
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = products.map(function (p, index) {
      return renderProductCard(p, Object.assign({}, options, { index: index }));
    }).join("");
  }

  function renderSwiper(containerId, products, options) {
    var wrapper = document.querySelector("#" + containerId + " .swiper-wrapper");
    if (!wrapper) return;
    wrapper.innerHTML = products.map(function (p) {
      return renderProductSlide(p, options);
    }).join("");
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function finishIntroReveal(intro) {
    if (intro) {
      intro.classList.add("is-opening", "is-done");
      intro.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("norye-loading");
    document.body.classList.add("norye-ready");
    dismissPageVeil();

    document.querySelectorAll("#billboard [data-aos]").forEach(function (el) {
      el.classList.add("aos-animate");
    });

    if (typeof AOS !== "undefined") {
      AOS.init({ once: true, duration: 700, offset: 60 });
    }

    if (typeof awakenHeroShowcase === "function") {
      window.setTimeout(awakenHeroShowcase, 250);
    }
  }

  function initIntroAnimations() {
    var intro = document.getElementById("noryeIntro");

    document.body.classList.add("norye-loading");

    if (prefersReducedMotion()) {
      finishIntroReveal(intro);
      return;
    }

    window.setTimeout(function () {
      if (intro) intro.classList.add("is-opening");
    }, 600);

    window.setTimeout(function () {
      finishIntroReveal(intro);
    }, 1400);
  }

  function dismissPreloader() {
    var intro = document.getElementById("noryeIntro");
    if (!intro || intro.classList.contains("is-done")) return;
    finishIntroReveal(intro);
  }

  function ensurePageVeil() {
    var veil = document.getElementById("norye-page-veil");
    if (veil) return veil;

    veil = document.createElement("div");
    veil.id = "norye-page-veil";
    veil.className = "norye-page-veil";
    veil.setAttribute("aria-hidden", "true");
    document.body.appendChild(veil);
    return veil;
  }

  function dismissPageVeil() {
    var veil = document.getElementById("norye-page-veil");
    if (veil) {
      veil.classList.remove("is-active", "is-leaving");
    }
  }

  function isSameOriginPageLink(href) {
    if (!href || href.charAt(0) === "#") return false;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;
    if (/instagram|whatsapp|wa\.me/i.test(href)) return false;

    var target;
    try {
      target = new URL(href, window.location.href);
    } catch (err) {
      return false;
    }

    if (target.origin !== window.location.origin) return false;

    var current = new URL(window.location.href);
    if (target.pathname === current.pathname && target.search === current.search) {
      return false;
    }

    return /\.html?$/i.test(target.pathname) || target.pathname === "/" || !/\./.test(target.pathname.split("/").pop());
  }

  function initPageTransitions() {
    var veil = ensurePageVeil();
    var reduced = prefersReducedMotion();

    if (!reduced) {
      veil.classList.add("is-active");
    }

    function tryDismissVeil() {
      if (
        document.body.classList.contains("norye-ready") ||
        document.body.classList.contains("norye-page-ready")
      ) {
        dismissPageVeil();
      }
    }

    var observer = new MutationObserver(tryDismissVeil);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("load", function () {
      window.setTimeout(tryDismissVeil, 50);
    });

    if (reduced) return;

    document.body.addEventListener("click", function (e) {
      var link = e.target.closest("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      if (!isSameOriginPageLink(link.getAttribute("href"))) return;

      e.preventDefault();
      var destination = new URL(link.getAttribute("href"), window.location.href).href;
      veil.classList.add("is-active", "is-leaving");
      window.setTimeout(function () {
        window.location.href = destination;
      }, 320);
    });
  }

  function initPriceReveal(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var prices = scope.querySelectorAll(
      ".norye-product-price:not(.is-price-visible), .norye-detail-price:not(.is-price-visible)"
    );
    if (!prices.length) return;

    if (prefersReducedMotion()) {
      prices.forEach(function (el) {
        el.classList.add("is-price-visible");
      });
      return;
    }

    if (!priceRevealObserver) {
      priceRevealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-price-visible");
            priceRevealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2, rootMargin: "0px 0px -20px 0px" });
    }

    prices.forEach(function (el) {
      priceRevealObserver.observe(el);
    });
  }

  function initScrollReveals() {
    var features = document.querySelector(".features");
    var pins = document.querySelectorAll(".norye-location-pin");

    if (prefersReducedMotion()) {
      if (features) features.classList.add("is-revealed");
      pins.forEach(function (pin) {
        pin.classList.add("is-visible");
      });
      return;
    }

    var scrollObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (entry.target.classList.contains("features")) {
          entry.target.classList.add("is-revealed");
        } else {
          entry.target.classList.add("is-visible");
        }
        scrollObserver.unobserve(entry.target);
      });
    }, { threshold: 0.25 });

    if (features) scrollObserver.observe(features);
    pins.forEach(function (pin) {
      scrollObserver.observe(pin);
    });
  }

  function initCollectionViewToggle() {
    var grid = document.getElementById("collection-grid");
    var toggle = document.querySelector(".norye-view-toggle");
    if (!grid || !toggle) return;

    function applyCollectionView(view) {
      grid.classList.toggle("norye-collection-view-list", view === "list");
      toggle.querySelectorAll("[data-view]").forEach(function (btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-view") === view);
      });
    }

    applyCollectionView(sessionStorage.getItem(COLLECTION_VIEW_KEY) || "grid");

    toggle.querySelectorAll("[data-view]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var view = btn.getAttribute("data-view");
        sessionStorage.setItem(COLLECTION_VIEW_KEY, view);
        applyCollectionView(view);
        initPriceReveal(grid);
      });
    });
  }

  function initGlobal() {
    clearLegacyCheckoutStorage();
    ensurePageVeil();
    initPageTransitions();
    bindCartEvents();
    initSearch();
    initCheckoutForm();
    initNavDropdownHover();
    initMobileMenuActions();
    initScrollReveals();
    renderCartUI();
    if (!document.body.classList.contains("homepage")) {
      dismissPreloader();
    }
    window.addEventListener("load", dismissPreloader);
  }

  function getHeroShowcaseProducts() {
    var seen = {};
    var list = [];

    getFeaturedProducts().concat(getBestSellers()).forEach(function (p) {
      if (!seen[p.code]) {
        seen[p.code] = true;
        list.push(p);
      }
    });

    if (list.length < 4) {
      NORYE_PRODUCTS.forEach(function (p) {
        if (!seen[p.code] && list.length < 5) {
          seen[p.code] = true;
          list.push(p);
        }
      });
    }

    return list.slice(0, 5);
  }

  function buildHeroShowcaseSlide(product, index, angleStep, extraClass) {
    var className = "norye-hero-showcase-slide" + (extraClass ? " " + extraClass : "");
    return (
      '<a href="' + productUrl(product.code) + '" class="' + className + '" ' +
        'style="transform: rotateY(' + (angleStep * index) + 'deg) translateZ(150px)" data-index="' + index + '">' +
        '<span class="norye-hero-bottle">' +
          '<img class="norye-hero-bottle-image" src="' + product.image + '" alt="' + product.name + '">' +
          '<span class="norye-hero-bottle-reflection" aria-hidden="true">' +
            '<img src="' + product.image + '" alt="" tabindex="-1">' +
          "</span>" +
        "</span>" +
      "</a>"
    );
  }

  function normalizeHeroIndex(index, count) {
    return ((index % count) + count) % count;
  }

  function getHeroActiveIndex(rotation, count, angleStep) {
    return normalizeHeroIndex(Math.round(-rotation / angleStep), count);
  }

  function initHeroShowcase() {
    var ring = document.getElementById("hero-showcase-ring");
    var caption = document.getElementById("hero-showcase-caption");
    var dots = document.getElementById("hero-showcase-dots");
    var stage = document.getElementById("hero-showcase-stage");
    var showcase = document.getElementById("hero-showcase");
    if (!ring || !caption || !showcase) return;

    var products = getHeroShowcaseProducts();
    if (!products.length) return;

    var reducedMotion = prefersReducedMotion();
    var staticProduct = getProductByCode("n23") || products[0];
    var currentIndex = 0;
    var rafId = 0;

    function setCaption(product) {
      caption.textContent = product.number + " — Inspired by " + product.inspiredBy;
    }

    function renderDots(activeIndex) {
      if (!dots) return;
      dots.innerHTML = products.map(function (p, i) {
        var isActive = i === activeIndex;
        return (
          '<button type="button" class="norye-hero-showcase-dot' + (isActive ? " is-active" : "") + '" ' +
            'role="tab" aria-selected="' + isActive + '" aria-label="Show ' + p.number + '" data-index="' + i + '">' +
          "</button>"
        );
      }).join("");
    }

    function updateSlideFocus(activeIndex) {
      ring.querySelectorAll(".norye-hero-showcase-slide").forEach(function (slide) {
        var slideIndex = Number(slide.getAttribute("data-index"));
        slide.classList.toggle("is-front", slideIndex === activeIndex);
      });
    }

    function updateActiveState(index, fadeCaption) {
      currentIndex = normalizeHeroIndex(index, products.length);
      updateSlideFocus(currentIndex);
      if (fadeCaption) {
        caption.classList.add("is-fading");
        window.setTimeout(function () {
          setCaption(products[currentIndex]);
          caption.classList.remove("is-fading");
        }, 220);
      } else {
        setCaption(products[currentIndex]);
      }
      renderDots(currentIndex);
    }

    if (reducedMotion || products.length === 1) {
      ring.innerHTML = buildHeroShowcaseSlide(staticProduct, 0, 360, "is-static is-front");
      updateActiveState(0, false);
      if (dots) dots.hidden = true;
      showcase.classList.add("is-static", "is-live");
      return;
    }

    var count = products.length;
    var angleStep = 360 / count;
    var secondsPerBottle = 4;
    var spinDurationMs = count * secondsPerBottle * 1000;
    var rotationSpeed = 360 / spinDurationMs;
    var rotation = 0;
    var lastFrameTime = 0;
    var autoPausedUntil = 0;
    var touchStartX = 0;
    var touchActive = false;
    var isSnapping = false;

    ring.style.animation = "none";
    ring.innerHTML = products.map(function (p, i) {
      return buildHeroShowcaseSlide(p, i, angleStep, "");
    }).join("");

    showcase.classList.add("is-dormant");

    function applyRotation() {
      ring.style.transform = "rotateY(" + rotation + "deg)";
    }

    function getClosestRotationForIndex(index) {
      var baseTarget = -index * angleStep;
      var candidates = [baseTarget, baseTarget + 360, baseTarget - 360];
      return candidates.reduce(function (best, candidate) {
        return Math.abs(candidate - rotation) < Math.abs(best - rotation) ? candidate : best;
      }, candidates[0]);
    }

    function animateToIndex(index, fadeCaption) {
      var targetRotation = getClosestRotationForIndex(index);
      var startRotation = rotation;
      var startTime = performance.now();
      var duration = 480;
      isSnapping = true;
      pauseAutoSpin(5000);

      function step(now) {
        var progress = Math.min((now - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        rotation = startRotation + (targetRotation - startRotation) * eased;
        applyRotation();
        updateSlideFocus(getHeroActiveIndex(rotation, count, angleStep));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          rotation = targetRotation;
          isSnapping = false;
          applyRotation();
          updateActiveState(index, fadeCaption);
        }
      }

      window.requestAnimationFrame(step);
    }

    function snapToNearest() {
      animateToIndex(getHeroActiveIndex(rotation, count, angleStep), true);
    }

    function tick(timestamp) {
      if (!lastFrameTime) lastFrameTime = timestamp;
      var delta = timestamp - lastFrameTime;
      lastFrameTime = timestamp;

      if (
        !touchActive &&
        !isSnapping &&
        showcase.classList.contains("is-live") &&
        timestamp >= autoPausedUntil
      ) {
        rotation += rotationSpeed * delta;
      }

      applyRotation();

      var activeIndex = getHeroActiveIndex(rotation, count, angleStep);
      updateSlideFocus(activeIndex);
      if (activeIndex !== currentIndex && !isSnapping) {
        updateActiveState(activeIndex, true);
      }

      rafId = window.requestAnimationFrame(tick);
    }

    function pauseAutoSpin(ms) {
      autoPausedUntil = performance.now() + ms;
    }

    awakenHeroShowcase = function () {
      if (
        showcase.classList.contains("is-static") ||
        showcase.classList.contains("is-live") ||
        showcase.classList.contains("is-awakening")
      ) {
        return;
      }
      showcase.classList.remove("is-dormant");
      showcase.classList.add("is-awakening");
      window.setTimeout(function () {
        showcase.classList.add("lights-left-on");
      }, 100);
      window.setTimeout(function () {
        showcase.classList.add("lights-right-on");
      }, 500);
      window.setTimeout(function () {
        showcase.classList.add("is-live");
        showcase.classList.remove("is-awakening", "lights-left-on", "lights-right-on");
      }, 1000);
    };

    updateActiveState(0, false);
    applyRotation();
    rafId = window.requestAnimationFrame(tick);

    if (dots) {
      dots.hidden = false;
      dots.addEventListener("click", function (event) {
        var button = event.target.closest(".norye-hero-showcase-dot");
        if (!button) return;
        var index = Number(button.getAttribute("data-index"));
        if (Number.isNaN(index)) return;
        animateToIndex(index, true);
      });
    }

    if (stage) {
      stage.addEventListener("touchstart", function (event) {
        if (!event.changedTouches.length) return;
        touchActive = true;
        touchStartX = event.changedTouches[0].clientX;
        pauseAutoSpin(6000);
      }, { passive: true });

      stage.addEventListener("touchmove", function (event) {
        if (!touchActive || !event.changedTouches.length) return;
        var touchX = event.changedTouches[0].clientX;
        var deltaX = touchX - touchStartX;
        if (Math.abs(deltaX) > 2) {
          rotation += deltaX * 0.4;
          touchStartX = touchX;
          applyRotation();
          var activeIndex = getHeroActiveIndex(rotation, count, angleStep);
          updateSlideFocus(activeIndex);
          if (activeIndex !== currentIndex) {
            updateActiveState(activeIndex, true);
          }
        }
      }, { passive: true });

      stage.addEventListener("touchend", function () {
        touchActive = false;
        snapToNearest();
        pauseAutoSpin(4000);
      }, { passive: true });
    }

    window.addEventListener("beforeunload", function () {
      if (rafId) window.cancelAnimationFrame(rafId);
    });
  }

  function initHomepage() {
    renderSwiper("featured", getFeaturedProducts(), { badge: "featured" });
    renderSwiper("best-sellers", getBestSellers(), { badge: "bestseller" });

    var menCatImg = document.getElementById("men-category-image");
    var womenCatImg = document.getElementById("women-category-image");
    var menProduct = getProductByCode("n23");
    var womenProduct = getProductByCode("n12");
    if (menCatImg && menProduct) menCatImg.src = menProduct.image;
    if (womenCatImg && womenProduct) womenCatImg.src = womenProduct.image;

    initHeroShowcase();
    initIntroAnimations();
    window.addEventListener("load", initProductCarousels);
  }

  function initProductCarousels() {
    if (typeof Swiper === "undefined") return;

    var carouselIds = ["featured", "best-sellers"];

    carouselIds.forEach(function (id) {
      var swiperEl = document.querySelector("#" + id + " .swiper");
      if (!swiperEl) return;

      if (swiperEl.swiper) {
        swiperEl.swiper.destroy(true, true);
      }

      new Swiper("#" + id + " .swiper", {
        slidesPerView: 4,
        spaceBetween: 20,
        preventClicks: false,
        preventClicksPropagation: false,
        navigation: {
          nextEl: "#" + id + " .icon-arrow-right",
          prevEl: "#" + id + " .icon-arrow-left"
        },
        pagination: {
          el: "#" + id + " .swiper-pagination",
          clickable: true
        },
        breakpoints: {
          0: {
            slidesPerView: 2,
            spaceBetween: 20,
            pagination: {
              el: "#" + id + " .swiper-pagination",
              clickable: true
            }
          },
          999: { slidesPerView: 3, spaceBetween: 10 },
          1366: { slidesPerView: 4, spaceBetween: 40 }
        }
      });
    });

    initPriceReveal();
  }

  function revealAosElements() {
    document.querySelectorAll("[data-aos]").forEach(function (el) {
      el.classList.add("aos-animate");
    });
    if (typeof AOS !== "undefined") {
      AOS.init({ once: true, duration: 700, offset: 60 });
      AOS.refresh();
    }
  }

  function initPageReveal(callback) {
    document.body.classList.add("norye-page-loading");

    window.setTimeout(function () {
      document.body.classList.remove("norye-page-loading");
      document.body.classList.add("norye-page-ready");
      dismissPageVeil();
      revealAosElements();
      initPriceReveal();
      if (typeof callback === "function") {
        callback();
      }
    }, 150);
  }

  function initImageLoadFade(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var images = scope.querySelectorAll(".norye-product-card-image img, .norye-detail-image img");

    images.forEach(function (img) {
      function markLoaded() {
        img.classList.add("is-loaded");
        var wrapper = img.closest(".norye-product-card-image, .norye-detail-image");
        if (wrapper) wrapper.classList.add("is-loaded");
      }

      if (img.complete && img.naturalWidth > 0) {
        markLoaded();
      } else {
        img.addEventListener("load", markLoaded);
        img.addEventListener("error", markLoaded);
      }
    });
  }

  function initNavDropdownHover() {
    if (window.matchMedia("(max-width: 991.98px)").matches) return;

    document.querySelectorAll(".norye-navbar-center .dropdown-toggle").forEach(function (toggle) {
      toggle.addEventListener("click", function (e) {
        e.preventDefault();
      });
    });
  }

  function initCollectionPage() {
    var category = document.body.dataset.collection;
    if (!category) return;

    initCollectionViewToggle();
    renderGrid("collection-grid", getProductsByCategory(category), { animate: true });
    initImageLoadFade(document.getElementById("collection-grid"));
    initPageReveal(function () {
      initPriceReveal(document.getElementById("collection-grid"));
    });
  }

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function initProductPage() {
    var root = document.getElementById("product-detail-root");
    if (!root) return;

    var code = getQueryParam("code");
    var product = getProductByCode(code);

    if (!product) {
      root.innerHTML =
        '<div class="container py-5 text-center">' +
          '<h2 class="section-title">Product not found</h2>' +
          '<p class="mb-4">We could not find that perfume. Browse our collection instead.</p>' +
          '<a href="index.html#featured" class="btn btn-norye-gold">View Collection</a>' +
        "</div>";
      initPageReveal();
      return;
    }

    document.title = product.name + " | N Ō R Y E";

    var related = getRelatedProducts(product, 4);
    var relatedHtml = related.map(function (p, index) {
      return renderProductCard(p, { animate: true, index: index });
    }).join("");

    root.innerHTML =
      '<div class="container py-5">' +
        '<nav class="norye-breadcrumb mb-4" aria-label="breadcrumb">' +
          '<a href="index.html">Home</a>' +
          '<span>/</span>' +
          '<a href="' + collectionUrl(product.category) + '">' + product.categoryLabel + "</a>" +
          '<span>/</span>' +
          "<span>" + product.number + "</span>" +
        "</nav>" +
        '<div class="row g-5 align-items-start">' +
          '<div class="col-lg-6">' +
            '<div class="norye-detail-image">' +
              '<img src="' + product.image + '" alt="' + product.name + '" class="img-fluid">' +
            "</div>" +
          "</div>" +
          '<div class="col-lg-6">' +
            '<p class="norye-product-number">' + product.number + "</p>" +
            '<h1 class="norye-detail-title">' + product.name + "</h1>" +
            '<p class="norye-detail-inspired">Inspired by ' + product.inspiredBy + "</p>" +
            '<p class="norye-detail-meta">' + product.categoryLabel + " · " + product.size + "</p>" +
            '<p class="norye-detail-price">' + product.price + "</p>" +
            '<p class="norye-detail-description">' + product.description + "</p>" +
            (product.notes ? '<p class="norye-detail-notes"><strong>Perfume notes:</strong> ' + product.notes + "</p>" : "") +
            '<div class="d-flex flex-wrap gap-3 mt-4 norye-btn-pair">' +
              '<button type="button" class="btn btn-norye-gold" data-add-cart="' + product.code + '" data-open-cart>Add to Cart</button>' +
              '<button type="button" class="btn btn-norye-outline" id="detail-open-cart">View Cart</button>' +
            "</div>" +
          "</div>" +
        "</div>" +
        (related.length
          ? '<section class="mt-5 pt-5 border-top">' +
              '<h3 class="section-title text-uppercase mb-4">You May Also Like</h3>' +
              '<div class="row g-4">' + relatedHtml + "</div>" +
            "</section>"
          : "") +
      "</div>";

    var openCartBtn = document.getElementById("detail-open-cart");
    if (openCartBtn) {
      openCartBtn.addEventListener("click", openCartPanel);
    }

    initImageLoadFade(root);
    initPageReveal(function () {
      initPriceReveal(root);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initGlobal();

    if (document.getElementById("product-detail-root")) {
      initProductPage();
    } else if (document.body.classList.contains("homepage")) {
      initHomepage();
    } else if (document.body.classList.contains("collection-page")) {
      initCollectionPage();
    }
  });
})();
