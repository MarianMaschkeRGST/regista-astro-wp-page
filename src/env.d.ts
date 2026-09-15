// The Cloudflare adapter sets `locals.cfContext` but does not declare it.
declare namespace App {
  interface Locals {
    cfContext: ExecutionContext;
  }
}
