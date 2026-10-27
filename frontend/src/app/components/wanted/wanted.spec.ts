import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Wanted } from './wanted';

describe('Wanted', () => {
  let component: Wanted;
  let fixture: ComponentFixture<Wanted>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Wanted],
    }).compileComponents();

    fixture = TestBed.createComponent(Wanted);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
