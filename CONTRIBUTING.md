Any contributions are welcome for this repository. Please fork and open a pull
request if you want to update the README, can find and fix bugs, or want to
add some features.

### Adding new methods
There are a lot of different GraphQL endpoints for data in Khan Academy. I would
like to add and catalog them with this package. To add a new method, you can do
the following:

1. __Check the network tab in Chrome dev tools:__ When you visit a page, Khan
Academy is requesting data from their server to populate the page. You can open
the Chrome dev tools by right clicking on the page, and selecting `Inspect` at
the bottom of the page or using `Ctl+Shift+i`. You should get the dev tools, similar
to this (notice I have selected the `Network` tab):
![image](https://user-images.githubusercontent.com/2569898/85931936-ccd22100-b87c-11ea-8bbe-dcb2a7cd5976.png)

2. __Find your method in the network tab:__ With the dev tools open, you may need to refresh the page
with F5. You should see the various network calls, and can filter them down by typing "graphql" in the
`Filter` input. Clicking on request should give you the details. Here is an example of clicking on the `UserHasDismissedQuery`:
![image](https://user-images.githubusercontent.com/2569898/85932038-9e087a80-b87d-11ea-9216-93f37624ed0e.png)

3. __Copy the payload:__ At the bottom of the request details on the network tab, you should see a
section titled `Request Payload`. Make sure to click the `view source` option for that. Then you should
see something similar to:
![image](https://user-images.githubusercontent.com/2569898/85932096-048d9880-b87e-11ea-83e1-000910b0558e.png)

4. __Create a new branch, with the network name:__ For example `git checkout -b UserHasDismissedQuery`.

5. __Create a method in `index.js`__: Create a method in `KhanApi` class following these guidelines:
  * Give the method the same name as the network request. For example, if the endpoint is `UserHasDismissedQuery`, then my
  method name should be `UserHasDismissedQuery = async () => {...}`
  * add a `payload` variable to the method, and paste the copied value from the network request in step 3.
  * __Return your data using the `graphQL` method from the class with the correct endpoint:__ Now you can just use a simple helper method
to return your data. You should have something like:
 ```javascript
  UserHasDimissedQuery = async () => {
    let payload = let payload = {
      operationName: "UserHasDismissedQuery",
      variables: { itemName: "auto_class_creation_banner" },
      query:
        "query UserHasDismissedQuery($itemName: String!) {\n  dismissedItem(itemName: $itemName) {\n    id\n    isDismissed\n    __typename\n  }\n}\n",
    }
    
    // note this endpoint is the same as the one from the network call
    return this.graphQL("/UserHasDismissedQuery", payload)
  }
  ```
  
7. __Check that your new method works, and submit a pull request__: Once you have everything working, submit a pull request
with the branch you created in step 4.
