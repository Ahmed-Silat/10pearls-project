import { describeDuplicates } from "./DuplicateNotice";

test("one line per contact, naming every field that matches", () => {
  expect(
    describeDuplicates([
      { id: 5, firstName: "ali", lastName: "khan", field: "phone" },
      { id: 6, firstName: "sara", lastName: "", field: "email" },
      { id: 5, firstName: "ali", lastName: "khan", field: "email" },
    ])
  ).toEqual([
    { id: 5, name: "ali khan", sameWhat: "phone number and email" },
    { id: 6, name: "sara", sameWhat: "email" },
  ]);
});
