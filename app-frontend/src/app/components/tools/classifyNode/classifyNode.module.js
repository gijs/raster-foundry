import angular from 'angular';
import classifyNodeTpl from './classifyNode.html';

import { getNodeDefinition} from '../../../redux/node-utils';
import NodeActions from '../../../redux/actions/node-actions';

const ClassifyNodeComponent = {
    templateUrl: classifyNodeTpl,
    controller: 'ClassifyNodeController',
    bindings: {
        nodeId: '<'
    }
};

class ClassifyNodeController {
    constructor(
        $log, $scope, $ngRedux, $uibModal,
        reclassifyService, toolService
    ) {
        'ngInject';
        this.$log = $log;
        this.$uibModal = $uibModal;
        this.reclassifyService = reclassifyService;
        this.toolService = toolService;

        let unsubscribe = $ngRedux.connect(
            this.mapStateToThis.bind(this),
            NodeActions
        )(this);
        $scope.$on('$destroy', unsubscribe);
    }

    mapStateToThis(state) {
        const node = getNodeDefinition(state, this);
        let breaks;
        try {
            breaks = this.classmapToBreaks(node.classMap.classifications);
        } catch (e) {
            breaks = [];
        }
        return {
            node,
            breaks
        };
    }

    /**
     * Takes a class-map and returns an array of breaks
     *
     * @param {object} classmap classmap object
     * @returns {array} array of break objects
     * @memberof ClassifyNodeController
     *
     * @example
     * // returns [{ break: 128, value: 0, start: "Min"}, { break: 255, value: 1, start: 128}]
     * preprocessBreaks({
     *     "128.0": 0,
     *     "255.0": 1
     * });
    * */
    classmapToBreaks(classmap) {
        return Object.keys(classmap).map((b, i, keys) => {
            const prev = keys[i - 1];
            // eslint-disable-next-line eqeqeq
            const start = prev != null ? +prev : 'Min';
            return {
                break: +b,
                value: classmap[b],
                start
            };
        });
    }

    /**
     * Converts array of break objects to a classmap
     *
     * @param {array} breaks array of break objects
     * @returns {object} classmap object
     * @memberof ClassifyNodeController
     */
    breaksToClassmap(breaks) {
        return breaks.reduce((acc, b) => {
            acc[b.break] = b.value;
            return acc;
        }, {});
    }

    showReclassifyModal() {
        this.activeModal = this.$uibModal.open({
            component: 'rfReclassifyModal',
            resolve: {
                breaks: () => this.breaks.map(b => Object.assign({}, b)),
                nodeId: () => this.nodeId
            }
        });

        this.activeModal.result.then(breaks => {
            const classmap = this.breaksToClassmap(breaks);
            this.updateNode({
                payload: Object.assign({}, this.node, {
                    classMap: {
                        classifications: classmap
                    }
                }),
                hard: true
            });
        });
    }
}

const ClassifyNodeModule = angular.module('components.tools.classifyNode', []);

ClassifyNodeModule.component('rfClassifyNode', ClassifyNodeComponent);
ClassifyNodeModule.controller('ClassifyNodeController', ClassifyNodeController);

export default ClassifyNodeModule;
