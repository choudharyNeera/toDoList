const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config()

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.DB_URL, {useNewUrlParser: true});
const itemSchema = {
  name: String
}
const listSchema = {
  name: String,
  item: [itemSchema]
}

const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);
const item1 = new Item ({
  name: "Welcome to your todo list!"
})
const item2 = new Item ({
  name: "Hit the button to add an item"
})
const item3 = new Item ({
  name: "Check the item to delete"
})
const defaultItems = [item1, item2, item3]

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err)
        }else{
          console.log("Successfully saved default items")
        }
      })
      res.redirect("/")
    }else{
      let day = date.getDate();
      res.render("list", {listTitle: day, newListItems: foundItems});
    }
  })
});

app.get("/:customRoot", function(req, res){
  const customList = _.capitalize(req.params.customRoot)
  List.findOne({name: customList}, function(err, foundList){
    if(!err){
      if(!foundList){
        const list = new List({
          name: customList,
          item: defaultItems
        })
        list.save()
        res.redirect("/" + customList)
      }else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.item});
      }
    }
  })

})

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = Item({
    name: itemName,
  })

  if(listName === date.getDate()){
    item.save()
    res.redirect("/")
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.item.push(item)
      foundList.save();
      res.redirect("/" + listName)
    })
  }
});

app.post("/delete", function(req, res){
  const checkedId = req.body.checked
  const listName = req.body.listName

  if(listName === date.getDate()){
    Item.findByIdAndRemove(checkedId, function(err){
      if(err){
        console.log(err)
      }else{
        console.log("Successfully deleted")
      }
      res.redirect("/")
    })
  }else{
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {item: {_id: checkedId}}},
      function(err, foundList){
        if(!err){
          res.redirect("/"+ listName)
        }
      })
  }
})


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started on port 3000");
});
