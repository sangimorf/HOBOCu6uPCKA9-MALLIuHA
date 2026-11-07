// Обёртка для сериализации/десериализации карты
export function toJSON(model) {
    return model.toJSON();
}

export function fromJSON(data, ModelClass) {
    return ModelClass.fromJSON(data);
}