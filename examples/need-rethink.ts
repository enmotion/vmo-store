function createReactiveProxy(data:Record<string,any>, path:string[] = []): Record<string, any> {
  return new Proxy(data, {
    get(target, key, receiver) {
      const fullPath = path.concat(key as string);
      console.log('Getting path:', fullPath.join('.'));
      if (typeof target[key as string] === 'object' && target[key as string] !== null) {
        return createReactiveProxy(target[key as string], path.concat(key as string));
      }
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      const fullPath = path.concat(key as string);
      console.log('Setting path:', fullPath.join('.'));
      // 你的自定义逻辑，例如类型检查
      if (key === 'name' && typeof value !== 'string') {
        console.error('Invalid value type for name');
        return false;
      }
      return Reflect.set(target, key, value, receiver);
    }
  });
}

const initialState = {
  user: {
    name: 'initialName',
    age: 25,
    address: {
      city: 'initialCity'
    }
  }
};

const store = createReactiveProxy(initialState);

// 测试

store.user.name = 'newName'; // Setting path: user.name
store.user.address.city = 'newCity'; // Setting path: user.address.city
store.user.address.street = 'newStreet'; // Setting path: user.address.street
store.user.address = { city: 'updatedCity', street: 'updatedStreet' }; // Setting path: user.address
console.log(store.user.address.city)