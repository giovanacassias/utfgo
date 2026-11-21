import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  template: `<h2 class="text-title font-bold">{{ title }}</h2>`,
})
export class PlaceholderPage {
  readonly title = inject(ActivatedRoute).snapshot.data['title'] as string;
}
