import store from "store";
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";

import * as core from "../utils/core";
import { DEFAULT_ID } from "../js/constants";

export default class StoreService {
  constructor(table) {
    this.table = table;
  }

  create(item) {
    if (!item.id) {
      item.id = uuidv4();
    }
    let allItems = this.all();
    item.createdAt = core.getTime();
    item.updatedAt = core.getTime();
    store.set(this.table, allItems.push(item));

    return item;
  }

  update(item) {
    let allItems = this.all();
    const itemIndex = allItems.findIndex((i) => i.id === item.id);
    if (itemIndex >= 0) {
      item.updatedAt = core.getTime();
      allItems[itemIndex] = item;
      store.set(this.table, allItems);

      return allItems;
    } else {
      return undefined;
    }
  }

  merge(item) {
    item.updatedAt = core.getTime();

    let allItems = this.all();
    const itemIndex = allItems.findIndex((i) => i.id === item.id);
    if (itemIndex >= 0) {
      allItems[itemIndex] = { ...allItems[itemIndex], ...item };
      store.set(this.table, allItems);
    } else {
      item.createdAt = core.getTime();
      allItems.push(item);
      store.set(this.table, allItems);
    }

    return allItems;
  }

  updateOrCreate(item) {
    if (!item.id || item.id === DEFAULT_ID) {
      item.id = uuidv4();
    }
    item.updatedAt = core.getTime();

    let allItems = this.all();
    const itemIndex = allItems.findIndex((i) => i.id === item.id);
    if (itemIndex >= 0) {
      allItems[itemIndex] = item;
      store.set(this.table, allItems);
    } else {
      item.createdAt = core.getTime();
      allItems.push(item);
      store.set(this.table, allItems);
    }

    return item;
  }

  recent() {
    return _.maxBy(this.all(), "updatedAt");
  }

  getIsEditting() {
    return _.find(this.all(), { isEditting: true });
  }

  changeEdittingAll(id) {
    let allItems = _.filter(this.all(), (item) => {
      if (item.id !== id) item.isEditting = false;
      if ((item.name.trim() !== "" && !item.isEditting && item.id !== id) || item.id === id) return item;
    });
    store.set(this.table, allItems);
  }

  size() {
    return this.all().filter((item) => item.name.trim() !== "").length;
  }

  find(id) {
    return _.find(this.all(), { id });
  }

  findBy(condition) {
    return _.find(this.all(), condition);
  }

  first() {
    return _.first(this.all());
  }

  last() {
    return _.last(this.all());
  }

  all() {
    return _.orderBy(store.get(this.table) || [], ["updatedAt"], ["desc"]);
  }

  query(condition) {
    return _.filter(this.all(), condition);
  }

  delete(id) {
    let allItems = this.all();
    _.remove(allItems, (item) => {
      return item.id === id;
    });
    store.set(this.table, allItems);

    return allItems;
  }

  deleteAll() {
    store.set(this.table, []);
  }
}
