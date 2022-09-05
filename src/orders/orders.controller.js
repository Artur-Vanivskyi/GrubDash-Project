const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res, next) {
  res.json({ data: orders });
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}`,
  });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const {
      data = {},
    } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a ${propertyName}`,
    });
  };
}

function update(req, res, next) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.status(200).json({ data: order });
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  const deleteOrder = orders.splice(index, 1);
  res.sendStatus(204);
}

function dishQuantityValidation(req, res, next) {
  const {
    data: { dishes },
  } = req.body;
  dishes.forEach(({ quantity }, index) => {
    if (quantity && typeof quantity === "number" && quantity > 0) {
      null;
    } else {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

function hasOneDish(req, res, next){
  const {data: {dishes} = {}} = req.body;
  if(!Array.isArray(dishes) || dishes.length === 0){
    next({
      status: 400,
      message: `Order must include at least one dish`
    })
  }
  next()
}

function orderNotDelivered(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "delivered") {
    next();
  } else {
    next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
}

function orderPending(req, res, next) {
  const order = res.locals.order;
  if (order.status === "pending") {
    next();
  } else {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
}

function stringValidation(propertyName){
  return function(req, res, next){
    const {data = {}} = req.body;
    if(typeof data[propertyName] === "string" && data[propertyName].length > 0){
      return next()
    }
  }
  next({
    status: 400,
    message: "`Dish must include a ${propertyName}`"
  })
}


function idValidation(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (!id || orderId == id || id.length === 0) {
    next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
  });
}

function statusValidation(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (validStatus.includes(status)) {
    next();
  }
  next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

module.exports = {
  read: [orderExists, read],
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    hasOneDish,
    dishQuantityValidation,
    stringValidation("deliverTo"),
    stringValidation("mobileNumber"),
    create,
  ],
  update: [
    orderExists,
    idValidation,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    bodyDataHas("dishes"),
    hasOneDish,
    dishQuantityValidation,
    stringValidation("deliverTo"),
    stringValidation("mobileNumber"),
    statusValidation,
    orderNotDelivered,
    update,
  ],
  delete: [orderExists, orderPending, destroy],
  list,
};
