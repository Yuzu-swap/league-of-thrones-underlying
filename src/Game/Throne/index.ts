interface ActionResponseArgs {
  actId: string;
  context: any;
  result: any;
}
interface IComponent {
  //trigger when state update
  onStateUpdate(callback: () => void): void;
  //trigger when action is response
  onActionResponse(callback: (args: ActionResponseArgs) => void): void;
}

export interface ICityComponent extends IComponent {
  //TODO: replace any with inteface
  getFacilityList(): any;
  getResource(): any;
  getFacilityUpgradeRequirement(): any;

  doUpgradeFacility(): void;
}

export enum ComponentType {
  City = 1,
  General = 2
}

export interface IThrone {
  initComponent<T extends IComponent>(
    typ: ComponentType,
    callback: (component: T) => void
  ): void;
}

export class Throne implements IThrone {
  //singleton
  static throne: Throne;
  static instance() {
    if (!Throne.throne) {
      Throne.throne = new Throne();
    }
    return this.throne;
  }

  components: { [key: string]: IComponent } = {};
  constructor() {}

  initComponent<T extends IComponent>(
    typ: ComponentType,
    callback: (component: T) => void
  ) {}
}

function example() {
  Throne.instance().initComponent(
    ComponentType.City,
    (city: ICityComponent) => {
      console.log('City init');

      // bind button with action
      // button.onClick = () =>{
      //city.doUpgradeFacility()

      // watch action response
      city.onActionResponse(() => {});

      // watch state update
      city.onStateUpdate(() => {
        // regenerate  ui state
        const facilities = city.getFacilityList();
        const resource = city.getResource();
        const uiState = { facilities, resource };

        // rerender by new state
      });
      //update
    }
  );
}
