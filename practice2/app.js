const express = require('express');
const app = express();
const port = 3000;

// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(express.static('public'));

// app.use((req, res, next) => {
//     console.log(`${req.method} ${req.url}`);
//     next();
// });


// app.get('/'
// , (req, res) => {
// res.send('Hello, world!');
// });
// app.listen(port, () => {
// console.log(`Сервер запущен на http://localhost:${port}`);
// });


// let users = [
//     {id: 1, name:'Петр', age: 18},
//     {id: 2, name:'Иван', age: 25},
//     {id: 3, name:'Сидор', age: 30}
// ];

// app.use(express.json());

// app.get('/', (req, res) => {
//     res.send('Главная страница');
// });

// app.post('/users', (req, res) => {
//     const {name, age} = req.body;
//     const newUser = {
//         id: Date.now(),
//         name, 
//         age
//     };

//     users.push(newUser);
//     res.status(201).json(newUser);
// });

// app.get('/users', (req, res) => {
//     res.send(JSON.stringify(users));
// });

// app.get('/users/:id', (req, res) => {
//     let user = users.find(u => u.id == req.params.id);
//     res.send(JSON.stringify(user));
// });

// app.patch('/users/:id', (req, res) => {
//     const user = users.find(u => u.id == req.params.id);
//     const {name, age} = req.body;

//     if(name !== undefined) user.name = name;
//     if(age !== undefined) user.age = age;

//     res.json(user);
// });

// app.delete('/users/:id', (req, res) => {
//     users = users.filter(u => u.id != req.params.id);
//     res.json('Ok');
// })

// app.listen(port, () => {console.log(`Сервер запущен на http://localhost:${port}`)});


let goods =  [
    {id: 1, name: 't-shitr', price: '15$'},
    {id: 2, name: 'compressor', price: '2000$'},
    {id:3, name: 'RTX 3060ti', price: '500$'},
    {id: 4, name: 'mazda 3 2024', price: '26000$'}
];

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Главная страница');
});

app.post('/goods', (req, res) => {
    const {name, price} = req.body;
    const newGoods = {
        id: Date.now(),
        name,
        price
    };

    res.push(newGoods);
res});

app.get('/goods', (req, res) => {
    res.send(JSON.stringify(goods));
});

app.get('/goods/:id', (req, res) => {
    let product = goods.find(u => u.id == res.params.id);
    res.send(JSON.stringify(product));
});

app.patch('/goods/:id', (req, res) => {
    const product = goods.find(u => u.id == req.params.id);
    const {name, price} = req.body;

    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;

    res.json(product);
});

app.delete('/goods/:id', (req, res) => {
    goods = goods.filter(u => u.id != req.params.id);
    res.send('ok');
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`)
})
