# Icon picker
## Usage
```javascript
const iconPicker = new IconPicker('input', {
    // Options
});
```

## Events
Use the `on(event, callback)` and `off(event, callback)` functions to bind / unbind eventlistener.

| Event          | Description         | Arguments            |
| -------------- | -----------         | ---------            |
| `init`         | Initialization done | `IconPickerInstance` |
| `change`       | Icon has changed    | `string`             |

```javascript
iconPicker.on('init', instance => {
    console.log('Init:', instance);
}).on('change', (icon) => {
    console.log('Change:', icon);
});
```
