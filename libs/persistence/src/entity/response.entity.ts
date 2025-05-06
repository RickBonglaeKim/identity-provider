export class ResponseEntity<T> {
  constructor(isSucceed: boolean, data?: T) {
    this.isSucceed = isSucceed;
    this.data = data;
  }

  isSucceed: boolean;
  data?: T;
}
